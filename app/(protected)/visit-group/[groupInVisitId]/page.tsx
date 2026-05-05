import { GroupVisitDetailPage } from "./group-visit-detail-page";

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ groupInVisitId: string }>;
}>) {
  const { groupInVisitId } = await params;

  return <GroupVisitDetailPage groupInVisitId={groupInVisitId} />;
}
