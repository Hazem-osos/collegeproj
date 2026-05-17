import { InstructorAuthedLayout } from "@/components/InstructorAuthedLayout";

export default function InstructorGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InstructorAuthedLayout>{children}</InstructorAuthedLayout>;
}
