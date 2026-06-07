import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { createListing, updateListing, uploadPhotos, getListingById } from '@/api/listingApi'
import useAuthStore from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'

const STEPS = ['Basic Details', 'Location', 'Property Profile', 'Amenities', 'Photos']

const PROPERTY_TYPES_RESIDENTIAL = ['flat','house','builder_floor','plot','1rk','farmhouse']
const PROPERTY_TYPES_COMMERCIAL = ['shop','office','warehouse','other']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-between mb-10 px-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex-1 flex flex-col items-center relative">
          {i < STEPS.length - 1 && (
            <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < current ? 'bg-primary-500' : 'bg-gray-200'}`} />
          )}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all
            ${i < current ? 'bg-primary-500 text-white' : i === current ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-100 text-gray-400'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`mt-2 text-xs font-medium text-center hidden sm:block ${i === current ? 'text-primary-700' : 'text-gray-400'}`}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function Field({ label, required, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white transition"
const selectCls = inputCls + " appearance-none"

export default function CreateListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileRef = useRef()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [listingId, setListingId] = useState(id || null)
  const [photos, setPhotos] = useState([])
  const [photoUploading, setPhotoUploading] = useState(false)

  const isEdit = !!id

  const { data: existingListing, isLoading: fetchingListing } = useQuery({
    queryKey: ['listing-edit', id],
    queryFn: () => getListingById(id),
    enabled: isEdit,
    select: d => d.data.data.listing
  })

  const [form, setForm] = useState({
    // Step 1
    intent: 'sell',
    propertyCategory: 'residential',
    propertyType: 'flat',
    askingPrice: '',
    isPriceNegotiable: false,
    possessionStatus: 'ready',
    // Step 2
    state: '',
    city: '',
    locality: '',
    pincode: '',
    landmark: '',
    flatNo: '',
    // Step 3
    totalAreaValue: '',
    totalAreaUnit: 'sqft',
    builtupAreaValue: '',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    totalFloorsInBuilding: '',
    facing: '',
    roadWidth: '',
    propertyAge: '',
    description: '',
    ownershipType: '',
    documentsAvailable: [],
    // Step 4
    parkingAvailable: false,
    parkingType: '',
    powerBackup: '',
    waterSupply: '',
    isGatedSociety: false,
    loanAvailable: '',
    nearbyLandmarks: '',
    additionalInfo: '',
    preferredContactTime: 'anytime',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  
  useEffect(() => {
    if (existingListing) {
      setForm({
        intent: existingListing.intent || 'sell',
        propertyCategory: existingListing.propertyCategory || 'residential',
        propertyType: existingListing.propertyType || 'flat',
        askingPrice: existingListing.askingPrice || '',
        isPriceNegotiable: existingListing.isPriceNegotiable || false,
        possessionStatus: existingListing.possessionStatus || 'ready',
        state: existingListing.location?.state || '',
        city: existingListing.location?.city || '',
        locality: existingListing.location?.locality || '',
        pincode: existingListing.location?.pincode || '',
        landmark: existingListing.location?.landmark || '',
        flatNo: existingListing.location?.flatNo || '',
        totalAreaValue: existingListing.totalArea?.value || '',
        totalAreaUnit: existingListing.totalArea?.unit || 'sqft',
        builtupAreaValue: existingListing.builtupArea?.value || '',
        bedrooms: existingListing.bedrooms || '',
        bathrooms: existingListing.bathrooms || '',
        floors: existingListing.floors || '',
        totalFloorsInBuilding: existingListing.totalFloorsInBuilding || '',
        facing: existingListing.facing || '',
        roadWidth: existingListing.roadWidth || '',
        propertyAge: existingListing.propertyAge || '',
        description: existingListing.description || '',
        ownershipType: existingListing.ownershipType || '',
        documentsAvailable: existingListing.documentsAvailable || [],
        parkingAvailable: existingListing.amenities?.parking?.available || false,
        parkingType: existingListing.amenities?.parking?.type || '',
        powerBackup: existingListing.amenities?.powerBackup || '',
        waterSupply: existingListing.amenities?.waterSupply || '',
        isGatedSociety: existingListing.amenities?.isGatedSociety || false,
        loanAvailable: existingListing.amenities?.loanAvailable || '',
        nearbyLandmarks: existingListing.amenities?.nearbyLandmarks || '',
        additionalInfo: existingListing.amenities?.additionalInfo || '',
        preferredContactTime: existingListing.amenities?.preferredContactTime || 'anytime',
      })
    }
  }, [existingListing])

  const toggleDoc = (doc) => {
    setForm(f => ({
      ...f,
      documentsAvailable: f.documentsAvailable.includes(doc)
        ? f.documentsAvailable.filter(d => d !== doc)
        : [...f.documentsAvailable, doc]
    }))
  }

  const propertyTypes = form.propertyCategory === 'residential' ? PROPERTY_TYPES_RESIDENTIAL : PROPERTY_TYPES_COMMERCIAL

  // Role guard — only owners and builders can create listings
  if (user && user.role !== 'owner' && user.role !== 'builder') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center py-12">
        <Helmet><title>Access Restricted — SocialEstate</title></Helmet>
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
          <div className="text-5xl mb-4">�</div>
          <h2 className="font-display text-2xl font-bold text-primary-900 mb-3">Owner/Builder Account Required</h2>
          <p className="text-gray-500 text-sm mb-2">
            Your account is registered as <span className="font-semibold text-primary-700 capitalize">{user.role}</span>.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Only <strong>property owners and builders</strong> can create listings. Please register a separate owner or builder account to list your property.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/register?role=owner"
              className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-md">
              Register as Property Owner
            </Link>
            <button onClick={() => navigate(-1)}
              className="w-full py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const buildPayload = () => ({
    intent: form.intent,
    propertyCategory: form.propertyCategory,
    propertyType: form.propertyType,
    askingPrice: Number(form.askingPrice),
    isPriceNegotiable: form.isPriceNegotiable,
    possessionStatus: form.possessionStatus,
    location: {
      state: form.state,
      city: form.city,
      locality: form.locality,
      pincode: form.pincode,
      landmark: form.landmark,
      flatNo: form.flatNo,
    },
    totalArea: form.totalAreaValue ? { value: Number(form.totalAreaValue), unit: form.totalAreaUnit } : undefined,
    builtupArea: form.builtupAreaValue ? { value: Number(form.builtupAreaValue), unit: form.totalAreaUnit } : undefined,
    bedrooms: form.bedrooms || undefined,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
    floors: form.floors || undefined,
    totalFloorsInBuilding: form.totalFloorsInBuilding ? Number(form.totalFloorsInBuilding) : undefined,
    facing: form.facing || undefined,
    roadWidth: form.roadWidth ? Number(form.roadWidth) : undefined,
    propertyAge: form.propertyAge || undefined,
    description: form.description || undefined,
    ownershipType: form.ownershipType || undefined,
    documentsAvailable: form.documentsAvailable,
    amenities: {
      parking: { available: form.parkingAvailable, type: form.parkingType || undefined },
      powerBackup: form.powerBackup || undefined,
      waterSupply: form.waterSupply || undefined,
      isGatedSociety: form.isGatedSociety,
      loanAvailable: form.loanAvailable || undefined,
      nearbyLandmarks: form.nearbyLandmarks || undefined,
      additionalInfo: form.additionalInfo || undefined,
      preferredContactTime: form.preferredContactTime,
    },
  })

  const submitListing = async () => {
    setLoading(true)
    try {
      const payload = buildPayload()
      if (isEdit) {
        await updateListing(id, payload)
        toast.success(existingListing?.status === 'active' 
          ? 'Edit request submitted for admin approval!' 
          : 'Listing updated successfully!')
        navigate('/dashboard')
      } else {
        const res = await createListing(payload)
        const newId = res.data.data.listing._id
        setListingId(newId)
        setStep(4)
        toast.success('Listing saved! Now add photos.')
      }
    } catch {
      // toast handled by axios interceptor
    } finally {
      setLoading(false)
    }
  }

  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, failed: 0 })

  const handlePhotoUpload = async () => {
    if (!photos.length || !listingId) return
    setPhotoUploading(true)
    setUploadProgress({ current: 0, total: photos.length, failed: 0 })

    let uploaded = 0
    let failed = 0

    // Upload photos one by one to avoid Cloudinary timeouts on large batches
    for (let i = 0; i < photos.length; i++) {
      try {
        const fd = new FormData()
        fd.append('photos', photos[i])
        await uploadPhotos(listingId, fd)
        uploaded++
        setUploadProgress(p => ({ ...p, current: uploaded }))
      } catch (err) {
        failed++
        setUploadProgress(p => ({ ...p, failed }))
        console.error(`Failed to upload photo ${i + 1}:`, err)
      }
    }

    setPhotoUploading(false)

    if (failed === 0) {
      toast.success(`All ${uploaded} photo(s) uploaded successfully!`)
      navigate('/dashboard')
    } else if (uploaded > 0) {
      toast.success(`${uploaded} photo(s) uploaded. ${failed} failed — you can retry from your dashboard.`)
      navigate('/dashboard')
    } else {
      toast.error('Photo upload failed. Please check your internet and try again.')
    }
  }

  const next = () => {
    if (step === 0) {
      if (!form.askingPrice || !form.possessionStatus) { toast.error('Please fill all required fields.'); return }
    }
    if (step === 1) {
      if (!form.state || !form.city || !form.locality || !form.pincode) { toast.error('Please fill all location fields.'); return }
    }
    if (step === 3) { submitListing(); return }
    setStep(s => s + 1)
  }

  return (
    <>
      <Helmet>
        <title>List Your Property — SocialEstate</title>
        <meta name="description" content="Create a new property listing on SocialEstate. Reach thousands of verified buyers across India." />
      </Helmet>

      <div className="min-h-screen bg-cream py-12">
        <div className="page-container max-w-3xl mx-auto">
          {/* Header */}
            <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary-100">
              {isEdit ? '✏️ Edit Property' : ' List Your Property'}
            </div>
            <h1 className="font-display text-3xl font-bold text-primary-900 mb-2">{isEdit ? 'Edit Listing' : 'Create New Listing'}</h1>
            <p className="text-gray-500 text-sm">
              {isEdit 
                ? 'Update your property details. Active listings will require admin approval for changes.' 
                : 'Fill in the details below. Your listing goes live after admin verification.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <StepIndicator current={step} />

            {/* STEP 1 - Basic Details */}
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Listing Intent" required>
                  <div className="flex gap-3">
                    {['sell','rent'].map(v => (
                      <button key={v} type="button"
                        onClick={() => set('intent', v)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.intent === v ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                        {v === 'sell' ? '�️ Sell' : '� Rent'}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Property Category" required>
                  <div className="flex gap-3">
                    {['residential','commercial'].map(v => (
                      <button key={v} type="button"
                        onClick={() => { set('propertyCategory', v); set('propertyType', v === 'residential' ? 'flat' : 'shop') }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.propertyCategory === v ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                        {v === 'residential' ? '� Residential' : '� Commercial'}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Property Type" required>
                  <select className={selectCls} value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                    {propertyTypes.map(t => <option key={t} value={t}>{t.replace('_',' ').toUpperCase()}</option>)}
                  </select>
                </Field>

                <Field label="Asking Price (₹)" required>
                  <input className={inputCls} type="number" placeholder="e.g. 4500000" value={form.askingPrice} onChange={e => set('askingPrice', e.target.value)} />
                </Field>

                <Field label="Possession Status" required>
                  <select className={selectCls} value={form.possessionStatus} onChange={e => set('possessionStatus', e.target.value)}>
                    <option value="ready">Ready to Move</option>
                    <option value="under_construction">Under Construction</option>
                    <option value="new">New</option>
                  </select>
                </Field>

                <Field label="">
                  <label className="flex items-center gap-3 mt-2 cursor-pointer">
                    <input type="checkbox" checked={form.isPriceNegotiable} onChange={e => set('isPriceNegotiable', e.target.checked)}
                      className="w-5 h-5 accent-primary-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">Price is Negotiable</span>
                  </label>
                </Field>
              </div>
            )}

            {/* STEP 2 - Location */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="State" required>
                  <input className={inputCls} placeholder="e.g. Madhya Pradesh" value={form.state} onChange={e => set('state', e.target.value)} />
                </Field>
                <Field label="City" required>
                  <input className={inputCls} placeholder="e.g. Bhopal" value={form.city} onChange={e => set('city', e.target.value)} />
                </Field>
                <Field label="Locality" required>
                  <input className={inputCls} placeholder="e.g. Arera Colony" value={form.locality} onChange={e => set('locality', e.target.value)} />
                </Field>
                <Field label="Pincode" required>
                  <input className={inputCls} placeholder="e.g. 462016" maxLength={6} value={form.pincode} onChange={e => set('pincode', e.target.value)} />
                </Field>
                <Field label="Landmark">
                  <input className={inputCls} placeholder="e.g. Near DB Mall" value={form.landmark} onChange={e => set('landmark', e.target.value)} />
                </Field>
                <Field label="Flat / Plot No." hint="Kept private until listing is approved">
                  <input className={inputCls} placeholder="e.g. 302, Block B" value={form.flatNo} onChange={e => set('flatNo', e.target.value)} />
                </Field>
              </div>
            )}

            {/* STEP 3 - Property Profile */}
            {step === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Total Area">
                  <div className="flex gap-2">
                    <input className={inputCls} type="number" placeholder="Area" value={form.totalAreaValue} onChange={e => set('totalAreaValue', e.target.value)} />
                    <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white" value={form.totalAreaUnit} onChange={e => set('totalAreaUnit', e.target.value)}>
                      {['sqft','sqyd','marla','biswa','acres','bigha'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Built-up Area">
                  <input className={inputCls} type="number" placeholder="Built-up area (same unit)" value={form.builtupAreaValue} onChange={e => set('builtupAreaValue', e.target.value)} />
                </Field>
                <Field label="Bedrooms / Configuration">
                  <select className={selectCls} value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}>
                    <option value="">Select</option>
                    {['1bhk','2bhk','3bhk','4bhk+','na'].map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                  </select>
                </Field>
                <Field label="Bathrooms">
                  <input className={inputCls} type="number" min={1} max={10} placeholder="Number of bathrooms" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
                </Field>
                <Field label="Floor No.">
                  <input className={inputCls} placeholder="e.g. 3rd" value={form.floors} onChange={e => set('floors', e.target.value)} />
                </Field>
                <Field label="Total Floors in Building">
                  <input className={inputCls} type="number" placeholder="e.g. 10" value={form.totalFloorsInBuilding} onChange={e => set('totalFloorsInBuilding', e.target.value)} />
                </Field>
                <Field label="Facing">
                  <select className={selectCls} value={form.facing} onChange={e => set('facing', e.target.value)}>
                    <option value="">Select</option>
                    {['east','west','north','south','corner'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Road Width (ft)">
                  <input className={inputCls} type="number" placeholder="e.g. 30" value={form.roadWidth} onChange={e => set('roadWidth', e.target.value)} />
                </Field>
                <Field label="Property Age">
                  <select className={selectCls} value={form.propertyAge} onChange={e => set('propertyAge', e.target.value)}>
                    <option value="">Select</option>
                    <option value="new">New</option>
                    <option value="lt5">Less than 5 years</option>
                    <option value="5to10">5–10 years</option>
                    <option value="10to20">10–20 years</option>
                    <option value="20plus">20+ years</option>
                  </select>
                </Field>
                <Field label="Ownership Type">
                  <select className={selectCls} value={form.ownershipType} onChange={e => set('ownershipType', e.target.value)}>
                    <option value="">Select</option>
                    <option value="freehold">Freehold</option>
                    <option value="leasehold">Leasehold</option>
                    <option value="cooperative">Cooperative</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description" hint="Minimum 50 characters, max 500">
                    <textarea className={inputCls + ' resize-none'} rows={4}
                      placeholder="Describe the property — key features, nearby conveniences, what makes it special..."
                      value={form.description} onChange={e => set('description', e.target.value)} />
                    <p className={`text-xs mt-1 ${form.description.length < 50 ? 'text-orange-400' : 'text-green-500'}`}>{form.description.length}/500 characters</p>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Documents Available">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['registry','noc','mutation','map','rera','other'].map(doc => (
                        <button key={doc} type="button" onClick={() => toggleDoc(doc)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${form.documentsAvailable.includes(doc) ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                          {doc.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 4 - Amenities */}
            {step === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Power Backup">
                  <select className={selectCls} value={form.powerBackup} onChange={e => set('powerBackup', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Full Backup</option>
                    <option value="partial">Partial</option>
                    <option value="no">None</option>
                  </select>
                </Field>
                <Field label="Water Supply">
                  <select className={selectCls} value={form.waterSupply} onChange={e => set('waterSupply', e.target.value)}>
                    <option value="">Select</option>
                    <option value="municipal">Municipal</option>
                    <option value="borewell">Borewell</option>
                    <option value="both">Both</option>
                  </select>
                </Field>
                <Field label="Home Loan Available">
                  <select className={selectCls} value={form.loanAvailable} onChange={e => set('loanAvailable', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="not_sure">Not Sure</option>
                  </select>
                </Field>
                <Field label="Preferred Contact Time">
                  <select className={selectCls} value={form.preferredContactTime} onChange={e => set('preferredContactTime', e.target.value)}>
                    <option value="anytime">Any Time</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </Field>
                {form.parkingAvailable && (
                  <Field label="Parking Type">
                    <select className={selectCls} value={form.parkingType} onChange={e => set('parkingType', e.target.value)}>
                      <option value="">Select</option>
                      <option value="car">Car</option>
                      <option value="two_wheeler">Two Wheeler</option>
                      <option value="both">Both</option>
                    </select>
                  </Field>
                )}
                <Field label="Nearby Landmarks">
                  <input className={inputCls} placeholder="e.g. Near metro, school, hospital" value={form.nearbyLandmarks} onChange={e => set('nearbyLandmarks', e.target.value)} />
                </Field>
                <div className="sm:col-span-2 flex flex-wrap gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.parkingAvailable} onChange={e => set('parkingAvailable', e.target.checked)} className="w-5 h-5 accent-primary-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">� Parking Available</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isGatedSociety} onChange={e => set('isGatedSociety', e.target.checked)} className="w-5 h-5 accent-primary-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">�️ Gated Society</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Additional Information">
                    <textarea className={inputCls + ' resize-none'} rows={3} placeholder="Any other details buyers should know..."
                      value={form.additionalInfo} onChange={e => set('additionalInfo', e.target.value)} />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 5 - Photos */}
            {step === 4 && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-full border-2 border-dashed border-primary-200 rounded-2xl p-10 text-center bg-primary-50 cursor-pointer hover:bg-primary-100 transition-all"
                  onClick={() => fileRef.current.click()}>
                  <div className="text-5xl mb-3">�</div>
                  <p className="font-semibold text-primary-800 text-lg mb-1">Upload Property Photos</p>
                  <p className="text-sm text-gray-500">Click to select multiple images (JPG, PNG, WEBP)</p>
                  <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={e => setPhotos(Array.from(e.target.files))} />
                </div>
                {photos.length > 0 && (
                  <div className="w-full">
                    <p className="text-sm font-semibold text-gray-700 mb-3">{photos.length} photo(s) selected</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {photos.map((f, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-xs px-4 py-3 rounded-xl border border-amber-100 w-full">
                  <span>�</span> Photos significantly boost your listing score and buyer inquiries. Upload at least 5 photos for best results.
                </div>
                {photoUploading && uploadProgress.total > 0 && (
                  <div className="w-full mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Uploading photo {uploadProgress.current + 1} of {uploadProgress.total}...</span>
                      <span>{Math.round(((uploadProgress.current) / uploadProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                    </div>
                    {uploadProgress.failed > 0 && (
                      <p className="text-xs text-red-500 mt-1">{uploadProgress.failed} photo(s) failed</p>
                    )}
                  </div>
                )}
                <div className="flex gap-4 w-full">
                  <button onClick={() => navigate('/dashboard')} disabled={photoUploading}
                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Skip for Now
                  </button>
                  <button onClick={handlePhotoUpload} disabled={!photos.length || photoUploading}
                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {photoUploading ? <><span className="animate-spin">⏳</span> Uploading {uploadProgress.current}/{uploadProgress.total}…</> : '� Upload & Finish'}
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
                  className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  ← Back
                </button>
                <button onClick={next} disabled={loading || fetchingListing}
                  className="px-8 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-lg">
                  {loading ? <><span className="animate-spin inline-block">⏳</span> Saving…</> : fetchingListing ? <><span className="animate-spin inline-block">⏳</span> Loading…</> : step === 3 ? (isEdit ? '� Update Listing' : '✅ Submit Listing') : 'Next →'}
                </button>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">ℹ️ What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-primary-500 font-bold">1.</span> Our team reviews your listing within 24 hours</li>
              <li className="flex gap-2"><span className="text-primary-500 font-bold">2.</span> You pay a one-time ₹15,000 service fee to go live</li>
              <li className="flex gap-2"><span className="text-primary-500 font-bold">3.</span> We actively call buyers & promote on social media</li>
              <li className="flex gap-2"><span className="text-primary-500 font-bold">4.</span> 3–5% commission only on successful deal closure</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
