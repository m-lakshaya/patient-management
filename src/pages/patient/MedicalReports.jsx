import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import {
    FileUp,
    FileText,
    Search,
    Download,
    Trash2,
    Loader2,
    AlertCircle,
    FileIcon,
    Calendar as CalendarIcon
} from 'lucide-react'
import { withTimeout } from '../../utils/api'
import { toast } from 'react-hot-toast'

export default function MedicalReports() {
    const { profile } = useAuth()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [patientId, setPatientId] = useState(null)

    const fetchReports = async (pid) => {
        setLoading(true)
        try {
            const { data, error } = await withTimeout(
                supabase.from('medical_reports').select('*').eq('patient_id', pid).order('uploaded_at', { ascending: false }),
                5000,
                'Reports Fetch'
            )
            if (error) throw error
            setReports(data || [])
        } catch (error) {
            console.error('Reports Error:', error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        async function init() {
            if (!profile?.id) {
                setLoading(false)
                return
            }

            try {
                const { data: patientData, error: patientError } = await withTimeout(
                    supabase.from('patients').select('id').eq('user_id', profile.id).single(),
                    5000,
                    'Patient Lookup'
                )

                if (patientError || !patientData) {
                    console.warn('Reports: Patient record not found.')
                    setLoading(false)
                    return
                }
                setPatientId(patientData.id)
                fetchReports(patientData.id)
            } catch (error) {
                console.error('Reports Init Error:', error.message)
                setLoading(false)
            }
        }
        init()
    }, [profile])

    async function handleUpload(e) {
        const file = e.target.files[0]
        if (!file || !patientId) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${patientId}/${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('medical-reports')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: urlData } = await supabase.storage
                .from('medical-reports')
                .getPublicUrl(fileName)

            const { error: dbError } = await supabase
                .from('medical_reports')
                .insert({
                    patient_id: patientId,
                    report_name: file.name,
                    file_url: fileName // Store the path for signed URL later
                })

            if (dbError) throw dbError

            toast.success('Report uploaded successfully')
            fetchReports(patientId)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setUploading(false)
        }
    }

    async function handleDownload(path, name) {
        try {
            const { data, error } = await supabase.storage
                .from('medical-reports')
                .createSignedUrl(path, 60) // 60 seconds link

            if (error) throw error
            window.open(data.signedUrl, '_blank')
        } catch (error) {
            toast.error('Failed to generate download link')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Medical Reports</h2>
                    <p className="text-slate-500">Securely upload and manage your medical documents.</p>
                </div>
                <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-200">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                    Upload New Report
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                ) : reports.length > 0 ? (
                    reports.map((report) => (
                        <div key={report.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <FileIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <button className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="font-bold text-slate-900 truncate mb-1" title={report.report_name}>
                                {report.report_name}
                            </h3>
                            <p className="text-xs text-slate-500 mb-6 flex items-center gap-1">
                                Uploaded {new Date(report.uploaded_at).toLocaleDateString()}
                            </p>
                            <button
                                onClick={() => handleDownload(report.file_url, report.report_name)}
                                className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                View & Download
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No reports found</h3>
                        <p className="text-slate-500 mt-1">Upload your first medical report to keep it organized.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
