import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Правила на общността — Neighborhood Hub',
  description: 'Прочетете правилата за добросъседско поведение в Neighborhood Hub.',
}

export default function GuidelinesPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Правила на общността</h1>

      <div className="prose prose-gray prose-sm max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Уважение и учтивост</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Отнасяйте се с уважение към всеки съсед.</li>
            <li>Не публикувайте обидно, дискриминационно или агресивно съдържание.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Честни обяви</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Публикувайте само реални умения, инструменти и храна.</li>
            <li>Не използвайте платформата за търговски цели или реклама.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Споделяне на храна</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Споделяйте само безопасна и годна за консумация храна.</li>
            <li>Посочвайте алергени, когато е приложимо.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Спазване на договорености</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Отговаряйте навреме на заявки.</li>
            <li>При невъзможност — отменете навреме, за да не пречите на другите.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Последствия при нарушения</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Нарушенията могат да доведат до предупреждение или премахване на профила.</li>
            <li>Сигнализирайте за нарушения чрез бутона &quot;Докладвай&quot;.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
