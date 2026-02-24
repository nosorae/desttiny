import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'desttiny - 사주 기반 궁합 서비스',
  description: '사주, 별자리, MBTI로 알아보는 나의 운명적 궁합',
}

// 모바일 퍼스트 레이아웃 - max-w-[390px]로 모바일 화면 중앙 정렬
// 신비로운 다크/퍼플 계열 서비스 컨셉에 맞춰 bg-destiny-bg 적용
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} antialiased bg-destiny-bg`}>
        <div className="mx-auto w-full max-w-[390px] min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
