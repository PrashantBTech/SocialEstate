import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Helmet } from 'react-helmet-async'
import useAuthStore from '@/store/authStore'
import OTPInput from '@/components/common/OTPInput'
import { sendOTP } from '@/api/authApi'
import toast from 'react-hot-toast'

export default function Login() {
  const [step, setStep] = useState('mobile') // mobile | otp
  const [mobile, setMobile] = useState('')
  const [sending, setSending] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const { register, handleSubmit, formState: { errors } } = useForm()

  const handleSendOTP = async (data) => {
    setSending(true)
    try {
      await sendOTP({ mobile: data.mobile, purpose: 'login' })
      setMobile(data.mobile)
      setStep('otp')
      toast.success('OTP sent to your mobile!')
    } catch {}
    setSending(false)
  }

  const handleOTPComplete = async (otp) => {
    try {
      const user = await login({ mobile, otp })
      if (user.role === 'admin' || user.role === 'superadmin') navigate('/admin')
      else navigate(from)
    } catch {}
  }

  return (
    <>
      <Helmet><title>Login | SocialEstate</title></Helmet>
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">E</span>
              </div>
              <span className="font-display font-bold text-2xl text-primary-900">SocialEstate</span>
            </Link>
            <h1 className="font-display text-2xl font-bold text-primary-900 mb-2">
              {step === 'mobile' ? 'Welcome back' : 'Enter OTP'}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === 'mobile' ? 'Login with your registered mobile number' : `OTP sent to +91 ${mobile}`}
            </p>
          </div>

          <div className="card p-8">
            {step === 'mobile' ? (
              <form onSubmit={handleSubmit(handleSendOTP)} className="space-y-5">
                <div>
                  <label className="label">Mobile Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2.5 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-sm text-gray-500">+91</span>
                    <input {...register('mobile', {
                      required: 'Mobile number is required',
                      pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' }
                    })}
                    placeholder="98765 43210" type="tel" inputMode="numeric" maxLength={10}
                    className="input rounded-l-none flex-1" />
                  </div>
                  {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full justify-center">
                  {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {sending ? 'Sending OTP...' : 'Send OTP'}
                </button>
                <p className="text-center text-sm text-gray-500">
                  Don't have an account? <Link to="/register" className="text-primary-600 font-medium hover:underline">Register</Link>
                </p>
              </form>
            ) : (
              <div className="space-y-6">
                <OTPInput length={6} onComplete={handleOTPComplete} />
                {isLoading && (
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                  </div>
                )}
                <div className="text-center space-y-2">
                  <button onClick={() => handleSendOTP({ mobile })} className="text-sm text-primary-600 hover:underline font-medium">Resend OTP</button>
                  <br />
                  <button onClick={() => setStep('mobile')} className="text-sm text-gray-400 hover:text-gray-600">← Change number</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
