import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Helmet } from 'react-helmet-async'
import useAuthStore from '@/store/authStore'
import OTPInput from '@/components/common/OTPInput'
import { sendOTP } from '@/api/authApi'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'buyer', icon: <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, label: 'Buyer / Investor', desc: 'Browse and buy properties' },
  { value: 'owner', icon: <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, label: 'Property Owner', desc: 'List and sell your property' },
  { value: 'builder', icon: <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, label: 'Builder', desc: 'Promote and sell your projects' },
]

export default function Register() {
  const [step, setStep] = useState('role')   // role | form | otp
  const [selectedRole, setSelectedRole] = useState('')
  const [mobile, setMobile] = useState('')
  const [formData, setFormData] = useState(null)
  const [sending, setSending] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { role: searchParams.get('role') || 'buyer' }
  })

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam && ['buyer', 'owner', 'builder'].includes(roleParam)) {
      setSelectedRole(roleParam)
      setStep('form')
    }
  }, [])

  const onFormSubmit = async (data) => {
    setSending(true)
    try {
      await sendOTP({ mobile: data.mobile, purpose: 'register' })
      setMobile(data.mobile)
      setFormData({ ...data, role: selectedRole || data.role })
      setStep('otp')
      toast.success('OTP sent to your mobile!')
    } catch { }
    setSending(false)
  }

  const handleOTPComplete = async (otp) => {
    try {
      const user = await registerUser({ ...formData, otp })
      if (user.role === 'admin') navigate('/admin')
      else navigate('/dashboard')
    } catch { }
  }

  return (
    <>
      <Helmet><title>Create Account | SocialEstate</title></Helmet>
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">E</span>
              </div>
              <span className="font-display font-bold text-2xl text-primary-900">SocialEstate</span>
            </Link>
            <h1 className="font-display text-2xl font-bold text-primary-900 mb-2">Create your account</h1>
          </div>

          <div className="card p-8">
            {/* Step 1: Role Selection */}
            {step === 'role' && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-primary-800 mb-3">I am a...</p>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => { setSelectedRole(r.value); setStep('form') }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-primary-400 ${selectedRole === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
                      }`}>
                    <span className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">{r.icon}</span>
                    <div>
                      <p className="font-medium text-primary-900 font-body">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
                <p className="text-center text-sm text-gray-500 mt-4">
                  Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Login</Link>
                </p>
              </div>
            )}

            {/* Step 2: Details Form */}
            {step === 'form' && (
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50 rounded-lg">
                  <span className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">{ROLES.find(r => r.value === selectedRole)?.icon}</span>
                  <p className="text-sm font-medium text-primary-800">{ROLES.find(r => r.value === selectedRole)?.label}</p>
                  <button type="button" onClick={() => setStep('role')} className="ml-auto text-xs text-primary-500 hover:underline">Change</button>
                </div>
                <div>
                  <label className="label">Full Name *</label>
                  <input {...register('fullName', { required: 'Name is required', minLength: { value: 2, message: 'Name too short' } })}
                    className="input" placeholder="Your full name" />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="label">Mobile Number *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2.5 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-sm text-gray-500">+91</span>
                    <input {...register('mobile', { required: 'Required', pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid mobile number' } })}
                      className="input rounded-l-none flex-1" type="tel" inputMode="numeric" maxLength={10} placeholder="98765 43210" />
                  </div>
                  {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
                </div>
                <div>
                  <label className="label">Email (optional)</label>
                  <input {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                    className="input" type="email" placeholder="you@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
                    className="input" type="password" placeholder="Minimum 8 characters" />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">City</label>
                    <input {...register('city')} className="input" placeholder="Indore" />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input {...register('state')} className="input" placeholder="Madhya Pradesh" />
                  </div>
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full justify-center">
                  {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {sending ? 'Sending OTP...' : 'Send OTP & Create Account'}
                </button>
              </form>
            )}

            {/* Step 3: OTP */}
            {step === 'otp' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to <strong>+91 {mobile}</strong></p>
                </div>
                <OTPInput length={6} onComplete={handleOTPComplete} />
                {isLoading && <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-100 border-t-primary-500 rounded-full animate-spin" /></div>}
                <div className="text-center">
                  <button onClick={() => onFormSubmit(formData)} className="text-sm text-primary-600 hover:underline font-medium">Resend OTP</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
