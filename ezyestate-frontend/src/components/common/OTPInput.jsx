import { useRef, useState } from 'react'

export default function OTPInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(''))
  const inputs = useRef([])

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...values]
    next[i] = val.slice(-1)
    setValues(next)
    if (val && i < length - 1) inputs.current[i + 1]?.focus()
    const otp = next.join('')
    if (otp.length === length) onComplete(otp)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    const next = [...values]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setValues(next)
    if (pasted.length === length) onComplete(pasted)
    inputs.current[Math.min(pasted.length, length - 1)]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-3 justify-center">
      {values.map((v, i) => (
        <input key={i} ref={el => inputs.current[i] = el} type="text" inputMode="numeric"
          value={v} onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors bg-white" />
      ))}
    </div>
  )
}
