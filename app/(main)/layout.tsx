// (main) 그룹 레이아웃 - 인증이 필요한 메인 페이지 공통 레이아웃
// 하단 탭바를 포함하는 레이아웃
// TODO: 하단 탭바(프로필/궁합/결제이력) 구현 - 이슈 #N에서 작업 예정
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-16">{children}</main>
      {/* TODO: BottomTabBar 컴포넌트 */}
    </div>
  );
}
