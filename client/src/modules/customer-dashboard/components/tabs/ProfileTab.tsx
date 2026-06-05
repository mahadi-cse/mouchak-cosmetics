import React, { useEffect, useState } from 'react';
import { DESIGN } from '../../tokens';
import { toDateLabel, toDateInputValue, SectionContainer, LoadingState, ErrorState } from '../shared';
import {
  useCustomerDashboardProfile,
  useUpdateCustomerDashboardProfile,
  type CustomerDashboardProfile,
  type UpdateProfilePayload,
} from '@/modules/customer-dashboard';
import { useQueryClient } from '@tanstack/react-query';
import { PROFILE_QUERY_KEY } from '@/modules/auth/queries/useProfileQuery';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// ---------------------------------------------------------------------------
// Types & Schema
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string(),
  dateOfBirth: z.string(),
  gender: z.string(),
  defaultAddress: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string(),
  avatarUrl: z.string(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Input / Textarea primitives (keep styling consistent)
// ---------------------------------------------------------------------------

const inputCls = 'mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100';
const inputStyle = { borderColor: DESIGN.border, color: DESIGN.fg };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileTab() {
  const profileQuery        = useCustomerDashboardProfile();
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '', lastName: '', phone: '', address: '',
      dateOfBirth: '', gender: '', defaultAddress: '',
      city: '', postalCode: '', country: 'Bangladesh', avatarUrl: ''
    }
  });
  
  const watchAvatarUrl = watch('avatarUrl');

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        firstName:      profileQuery.data.firstName      || '',
        lastName:       profileQuery.data.lastName       || '',
        phone:          profileQuery.data.phone          || '',
        address:        profileQuery.data.address        || '',
        dateOfBirth:    toDateInputValue(profileQuery.data.dateOfBirth),
        gender:         profileQuery.data.gender         || '',
        defaultAddress: profileQuery.data.defaultAddress || '',
        city:           profileQuery.data.city           || '',
        postalCode:     profileQuery.data.postalCode     || '',
        country:        profileQuery.data.country        || 'Bangladesh',
        avatarUrl:      profileQuery.data.avatarUrl      || '',
      });
    }
  }, [profileQuery.data, reset]);

  const updateMutation = useUpdateCustomerDashboardProfile({
    onSuccess: () => { 
      reset(undefined, { keepValues: true }); // Reset isDirty, keep current values
      setNotice('Profile updated successfully.'); 
    },
    onError:   () => { setNotice('Failed to update profile. Please try again.'); },
  });

  if (profileQuery.isLoading) return <LoadingState message="Loading your profile details..." />;
  if (profileQuery.isError || !profileQuery.data) return <ErrorState message="Unable to load profile information." />;

  const profile = profileQuery.data;
  const canSave = isDirty && !updateMutation.isPending;

  const onSubmit = (data: ProfileFormData) => {
    setNotice('');
    const payload: UpdateProfilePayload = {
      firstName:      data.firstName.trim(),
      lastName:       data.lastName.trim(),
      phone:          data.phone.trim(),
      address:        data.address.trim(),
      dateOfBirth:    data.dateOfBirth,
      gender:         data.gender.trim(),
      defaultAddress: data.defaultAddress.trim(),
      city:           data.city.trim(),
      postalCode:     data.postalCode.trim(),
      country:        data.country.trim() || 'Bangladesh',
      avatarUrl:      data.avatarUrl,
    };
    updateMutation.mutate(payload);
  };

  return (
    <SectionContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xl font-bold shadow-sm border-2"
              style={{ background: DESIGN.softPink, color: DESIGN.primary, borderColor: DESIGN.primary }}
            >
              {watchAvatarUrl ? (
                <img src={watchAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                profile.firstName?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            {/* Edit Badge */}
            <div className="absolute bottom-0 right-0 bg-white border-2 border-white rounded-full p-1 shadow-md z-10 pointer-events-none" style={{ color: DESIGN.primary }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </div>
            <label
              className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
              htmlFor="avatar-upload"
            >
              {uploading ? '...' : 'Upload'}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const formData = new FormData();
                  formData.append('image', file);
                  const { apiClient } = await import('@/shared/lib/apiClient');
                  const res = await apiClient.post('/uploads/image?folder=mouchak/users', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  setValue('avatarUrl', res.data.data.url, { shouldDirty: true });
                  setNotice('Avatar uploaded. Remember to save.');
                  queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
                } catch (err) {
                  setNotice('Failed to upload image.');
                } finally {
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm" style={{ color: DESIGN.mutedFg }}>{profile.email}</p>
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ background: DESIGN.softPink, color: DESIGN.primary }}
        >
          {profile.segment}
        </span>
      </div>

      {/* Form grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {([
          { label: 'First Name', field: 'firstName', placeholder: 'First name', required: true },
          { label: 'Last Name',  field: 'lastName',  placeholder: 'Last name', required: true },
          { label: 'Phone',      field: 'phone',     placeholder: 'Phone number', required: true },
          { label: 'Gender',     field: 'gender',    placeholder: 'Gender', required: false },
        ] as { label: string; field: keyof ProfileFormData; placeholder: string; required?: boolean }[]).map(({ label, field, placeholder, required }) => {
          const hasError = !!errors[field];
          return (
            <label key={field} className="text-sm">
              <span style={{ color: DESIGN.mutedFg }}>{label} {required && <span className="text-red-500">*</span>}</span>
              <input
                {...register(field)}
                className={`${inputCls} transition-colors ${hasError ? 'border-red-400 bg-red-50' : ''}`}
                style={{ ...inputStyle, borderColor: hasError ? undefined : inputStyle.borderColor }}
                placeholder={placeholder}
              />
              {hasError && <p className="mt-1 text-xs text-red-500">{errors[field]?.message as string}</p>}
            </label>
          )
        })}

        <label className="text-sm">
          <span style={{ color: DESIGN.mutedFg }}>Date of Birth</span>
          <input
            type="date"
            {...register('dateOfBirth')}
            className={inputCls}
            style={inputStyle}
          />
        </label>

        <label className="text-sm">
          <span style={{ color: DESIGN.mutedFg }}>City</span>
          <input
            {...register('city')}
            className={inputCls}
            style={inputStyle}
            placeholder="City"
          />
        </label>

        <label className="text-sm md:col-span-2">
          <span style={{ color: DESIGN.mutedFg }}>Address</span>
          <textarea
            {...register('address')}
            rows={2}
            className={inputCls}
            style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
            placeholder="Primary address"
          />
        </label>

        <label className="text-sm md:col-span-2">
          <span style={{ color: DESIGN.mutedFg }}>Default Delivery Address</span>
          <textarea
            {...register('defaultAddress')}
            rows={2}
            className={inputCls}
            style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
            placeholder="Delivery address"
          />
        </label>

        <label className="text-sm">
          <span style={{ color: DESIGN.mutedFg }}>Postal Code</span>
          <input
            {...register('postalCode')}
            className={inputCls}
            style={inputStyle}
            placeholder="Postal code"
          />
        </label>

        <label className="text-sm">
          <span style={{ color: DESIGN.mutedFg }}>Country</span>
          <input
            {...register('country')}
            className={inputCls}
            style={inputStyle}
            placeholder="Country"
          />
        </label>
      </div>

      {/* Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs" style={{ color: DESIGN.mutedFg }}>
          Last updated on {toDateLabel(profile.updatedAt)}
        </div>
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            background:  canSave ? DESIGN.primary : '#9ca3af',
            boxShadow: canSave ? '0 8px 20px rgba(233,30,140,0.25)' : 'none',
          }}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {notice && (
        <p
          className="mt-3 text-sm font-semibold"
          style={{ color: notice.includes('success') ? DESIGN.success : '#b91c1c' }}
        >
          {notice}
        </p>
      )}
      </form>
    </SectionContainer>
  );
}
