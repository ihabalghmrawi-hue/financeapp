import { AuthPanel } from '@/components/auth/auth-panel'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthPanel subtitle="">{children}</AuthPanel>
}
