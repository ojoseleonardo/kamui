import React from 'react'
import { HardDrive, Trash2, FolderOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

const storageData = {
  total: 500,
  used: 342.5,
  clips: 156.2,
  processed: 128.5,
  system: 57.8,
}

function StorageWidget() {
  const usedPercentage = (storageData.used / storageData.total) * 100
  const freeSpace = storageData.total - storageData.used

  const segments = [
    { label: 'Clipes', value: storageData.clips, color: 'bg-kamui-red' },
    { label: 'Processados', value: storageData.processed, color: 'bg-kamui-red-dark' },
    { label: 'Sistema', value: storageData.system, color: 'bg-kamui-gray-light' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive size={18} className="text-kamui-red" />
          Armazenamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Circular Progress */}
        <div className="flex items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-kamui-gray"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#storageGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${usedPercentage * 3.52} 352`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b0000" />
                  <stop offset="100%" stopColor="#c41e3a" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-kamui-white">
                {usedPercentage.toFixed(0)}%
              </span>
              <span className="text-xs text-kamui-white-muted">Usado</span>
            </div>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="space-y-2">
          <div className="h-3 bg-kamui-gray rounded-full overflow-hidden flex">
            {segments.map((segment, index) => (
              <div
                key={index}
                className={`${segment.color} transition-all duration-500`}
                style={{ width: `${(segment.value / storageData.total) * 100}%` }}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm ${segment.color}`} />
                <div className="text-xs">
                  <span className="text-kamui-white-muted">{segment.label}</span>
                  <span className="text-kamui-white ml-1">{segment.value} GB</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-kamui-gray" />
              <div className="text-xs">
                <span className="text-kamui-white-muted">Livre</span>
                <span className="text-kamui-white ml-1">{freeSpace.toFixed(1)} GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <FolderOpen size={14} />
            Pasta
          </Button>
          <Button variant="danger" size="sm" className="flex-1">
            <Trash2 size={14} />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default StorageWidget
