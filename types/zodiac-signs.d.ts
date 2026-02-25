// zodiac-signs 라이브러리 타입 선언
// @types/zodiac-signs가 npm에 존재하지 않아 직접 작성
// 참고: https://github.com/helmasaur/zodiac-signs

declare module 'zodiac-signs' {
  interface ZodiacSignResult {
    name: string
    symbol: string
    element: string
    dates: string
  }

  interface ZodiacSignsInstance {
    getSignByDate(opts: { month: number; day: number }): ZodiacSignResult
    getSignByName(name: string): ZodiacSignResult
    getSigns(): ZodiacSignResult[]
  }

  function zodiacSignsFactory(lang: string): ZodiacSignsInstance

  export = zodiacSignsFactory
}
