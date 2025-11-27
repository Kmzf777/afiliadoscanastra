interface RankingItemProps {
  codigo: string
  vendas: number
  position: number
}

export function RankingItem({ codigo, vendas, position }: RankingItemProps) {
  const isTop3 = position <= 3
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg ${
      position % 2 === 0 ? 'bg-gray-50' : 'bg-white'
    } ${isTop3 ? 'border-2' : 'border'} ${
      isTop3 
        ? position === 1 
          ? 'border-amber-400 bg-amber-50'
          : position === 2
          ? 'border-gray-400 bg-gray-50'
          : 'border-orange-400 bg-orange-50'
        : 'border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          isTop3 
            ? position === 1
              ? 'bg-amber-500 text-white'
              : position === 2
              ? 'bg-gray-500 text-white'
              : 'bg-orange-500 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}>
          {position}
        </div>
        <span className="font-mono text-lg font-semibold">{codigo}</span>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-gray-900">{vendas}</div>
        <div className="text-sm text-gray-600">vendas</div>
      </div>
    </div>
  )
}