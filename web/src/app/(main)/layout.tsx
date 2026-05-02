import { AuthedLayout } from "@/components/AuthedLayout";

export default function MainGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthedLayout>{children}</AuthedLayout>;
}
