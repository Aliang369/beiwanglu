export interface UserProfile {
  id: string
  account: string
  name: string
  email: string
  bio: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  name?: string
  bio?: string
  avatarUrl?: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  lastPasswordChangedAt: string | null
}
