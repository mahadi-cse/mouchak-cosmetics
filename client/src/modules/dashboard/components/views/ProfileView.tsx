import React, { useEffect, useState } from "react";
import { Theme } from "@/modules/dashboard/utils/theme";
import { apiClient } from "@/shared/lib/apiClient";

export default function ProfileView() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        const data = response.data.data;
        setProfile(data);
        setForm({
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          email: data.email || '',
          phone: data.phone || 'No phone provided',
          address: data.address || 'Address not provided',
        });
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="flex h-full items-center justify-center p-8 text-center text-red-500">Failed to load profile. Please try again.</div>;
  }

  const initials = profile?.firstName?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U';
  const roleName = profile.userType?.name || 'USER';

  return (
    <div className="bg-gray-50 p-6 min-h-full rounded-tl-xl h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Profile Header & Personal Info (Takes up 4/12 or 5/12 columns on large screens) */}
          <div className="lg:col-span-4 xl:col-span-5 space-y-6">
            
            {/* Profile Header Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-row items-center gap-5 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-bold text-gray-900 text-lg sm:text-xl">{form.name}</p>
                  <span className="text-[10px] sm:text-xs border border-pink-200 text-pink-600 rounded-full px-3 py-1 bg-pink-50 font-bold uppercase tracking-wider">
                    {roleName}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">{form.email}</p>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-700">Personal Information</p>
                <button
                  onClick={async () => {
                    if (editMode) {
                      try {
                        const nameParts = form.name.split(' ');
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        const payload = {
                          firstName,
                          lastName,
                          phone: form.phone === 'No phone provided' ? '' : form.phone,
                          address: form.address === 'Address not provided' ? '' : form.address,
                        };
                        await apiClient.patch('/auth/profile', payload);
                        setProfile((prev: any) => ({ ...prev, ...payload }));
                      } catch (error) {
                        console.error('Failed to update profile', error);
                        alert('Failed to save profile changes.');
                      }
                    }
                    setEditMode(!editMode);
                  }}
                  className="text-xs font-medium text-pink-500 hover:text-pink-700 transition-colors bg-pink-50 px-3 py-1.5 rounded-md"
                >
                  {editMode ? "Save Changes" : "Edit Details"}
                </button>
              </div>
              <ul className="divide-y divide-gray-50">
                {[
                  { label: "Full Name", key: "name", icon: "👤" },
                  { label: "Email", key: "email", icon: "✉️" },
                  { label: "Phone", key: "phone", icon: "📞" },
                  { label: "Address", key: "address", icon: "📍" },
                ].map(({ label, key, icon }) => (
                  <li key={key} className="flex items-start gap-4 px-6 py-4">
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
                      {editMode && key !== 'email' ? (
                        <input
                          className="text-sm text-gray-900 font-medium w-full border-b border-gray-300 focus:border-pink-500 outline-none pb-1 bg-transparent transition-colors"
                          value={form[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-gray-900 font-medium truncate">{form[key]}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
          </div>

          {/* RIGHT COLUMN: Modules and Branches (Takes up 8/12 or 7/12 columns on large screens) */}
          <div className="lg:col-span-8 xl:col-span-7 space-y-6">
            
            <div className="grid grid-cols-1 gap-6">
              {/* Branches Card */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-sm font-bold text-gray-700">Branch Assignments</p>
                  <p className="text-xs text-gray-400 mt-0.5">Physical locations you manage</p>
                </div>
                <ul className="divide-y divide-gray-50 flex-1 overflow-auto">
                  {profile.userBranches && profile.userBranches.length > 0 ? (
                    profile.userBranches.map((ub: any) => (
                      <li key={ub.id} className="flex flex-col gap-2 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                              🏪
                            </div>
                            <p className="text-sm font-bold text-gray-800">{ub.branch?.name}</p>
                          </div>
                        </div>
                        <div className="ml-11 flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span>Code:</span> <span className="font-medium text-gray-600">{ub.branch?.branchCode}</span>
                          </span>
                          <span 
                            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                              ub.isPrimary ? 'bg-pink-100 text-pink-700' : 'bg-teal-100 text-teal-700'
                            }`}
                          >
                            {ub.isPrimary ? 'Primary' : 'Secondary'}
                          </span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-6 py-8 text-center text-sm text-gray-400">No branches assigned.</li>
                  )}
                </ul>
              </div>
            </div>
            
            {/* Assigned Modules (New Card to replace the raw roles integration) */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-700">App Modules</p>
                <p className="text-xs text-gray-400 mt-0.5">Active modules assigned to your account</p>
              </div>
              <ul className="divide-y divide-gray-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {profile.userModules && profile.userModules.length > 0 ? (
                  profile.userModules.map((um: any) => (
                    <li key={um.id} className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 border border-green-100 text-green-600 text-lg">
                        {um.module?.icon || '📦'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{um.module?.name}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-6 py-8 col-span-full text-center text-sm text-gray-400">
                    No app modules are assigned to your database profile yet.
                  </li>
                )}
              </ul>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
