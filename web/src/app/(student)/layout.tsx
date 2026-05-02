import { StudentAuthedLayout } from "@/components/StudentAuthedLayout";

export default function StudentGroupLayout({ children }: { children: React.ReactNode }) {
  return <StudentAuthedLayout>{children}</StudentAuthedLayout>;
}
