import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom node components
const ThesisNode = ({ data }) => (
  <div style={{
    background: 'rgba(0,255,136,0.08)',
    border: '2px solid #00ff88',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#e6edf3',
    fontSize: 12,
    maxWidth: 200,
    textAlign: 'center',
    fontFamily: 'JetBrains Mono',
    boxShadow: '0 0 20px rgba(0,255,136,0.2)',
  }}>
    <Handle type="source" position={Position.Right} style={{ background: '#00ff88' }} />
    <div style={{ color: '#00ff88', fontSize: 10, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>THESIS</div>
    <div style={{ fontWeight: 600, fontSize: 11 }}>{data.label}</div>
  </div>
)

const EffectNode = ({ data }) => {
  const colors = { 2: '#f59e0b', 3: '#8b5cf6' }
  const color = colors[data.order] || '#8b949e'
  return (
    <div style={{
      background: `${color}10`,
      border: `1.5px solid ${color}`,
      borderRadius: 6,
      padding: '8px 12px',
      color: '#e6edf3',
      fontSize: 11,
      maxWidth: 180,
      textAlign: 'center',
      fontFamily: 'JetBrains Mono',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: color }} />
      <Handle type="source" position={Position.Right} style={{ background: color }} />
      <div style={{ color, fontSize: 9, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>
        {data.order === 2 ? '2nd Order' : '3rd Order'}
      </div>
      <div style={{ fontSize: 11 }}>{data.label}</div>
    </div>
  )
}

const BetNode = ({ data }) => (
  <div style={{
    background: 'rgba(59,130,246,0.08)',
    border: '1.5px solid #3b82f6',
    borderRadius: 6,
    padding: '7px 12px',
    color: '#e6edf3',
    fontSize: 11,
    maxWidth: 160,
    textAlign: 'center',
    fontFamily: 'JetBrains Mono',
  }}>
    <Handle type="target" position={Position.Left} style={{ background: '#3b82f6' }} />
    <div style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>BET</div>
    <div style={{ fontWeight: 600, fontSize: 11 }}>{data.ticker || data.label}</div>
    {data.ticker && <div style={{ color: '#8b949e', fontSize: 9 }}>{data.label}</div>}
  </div>
)

const nodeTypes = { thesis: ThesisNode, effect: EffectNode, bet: BetNode }

export default function ThesisGraph({ thesis }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes = []
    const edges = []

    // Root thesis node
    nodes.push({
      id: 'thesis',
      type: 'thesis',
      position: { x: 0, y: 0 },
      data: { label: thesis.name },
      draggable: true,
    })

    // Group effects by order
    const effects2 = (thesis.second_order_effects || []).filter(e => e.order_level === 2)
    const effects3 = (thesis.second_order_effects || []).filter(e => e.order_level === 3)

    // 2nd order effects
    effects2.forEach((eff, i) => {
      const id = `eff2-${eff.id}`
      const yPos = (i - (effects2.length - 1) / 2) * 90
      nodes.push({
        id,
        type: 'effect',
        position: { x: 280, y: yPos },
        data: { label: eff.description.slice(0, 60) + (eff.description.length > 60 ? '…' : ''), order: 2 },
      })
      edges.push({
        id: `e-thesis-${id}`,
        source: 'thesis',
        target: id,
        style: { stroke: '#f59e0b', strokeWidth: 1.5, opacity: 0.6 },
        animated: false,
      })
    })

    // 3rd order effects
    effects3.forEach((eff, i) => {
      const id = `eff3-${eff.id}`
      const yPos = (i - (effects3.length - 1) / 2) * 80
      nodes.push({
        id,
        type: 'effect',
        position: { x: 560, y: yPos },
        data: { label: eff.description.slice(0, 60) + (eff.description.length > 60 ? '…' : ''), order: 3 },
      })
      // Connect from nearest 2nd order or thesis
      const parentId = effects2.length > 0
        ? `eff2-${effects2[Math.min(i, effects2.length - 1)].id}`
        : 'thesis'
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        style: { stroke: '#8b5cf6', strokeWidth: 1.5, opacity: 0.6 },
      })
    })

    // Actionable bets
    const activeBets = (thesis.bets || []).filter(b => b.status !== 'closed')
    activeBets.forEach((bet, i) => {
      const id = `bet-${bet.id}`
      const yPos = (i - (activeBets.length - 1) / 2) * 70
      nodes.push({
        id,
        type: 'bet',
        position: { x: 840, y: yPos },
        data: { label: bet.name, ticker: bet.ticker },
      })
      // Connect from 3rd order or thesis
      const parentId = effects3.length > 0
        ? `eff3-${effects3[Math.min(i, effects3.length - 1)].id}`
        : effects2.length > 0
          ? `eff2-${effects2[Math.min(i, effects2.length - 1)].id}`
          : 'thesis'
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        style: { stroke: '#3b82f6', strokeWidth: 1.5, opacity: 0.6 },
      })
    })

    return { nodes, edges }
  }, [thesis])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div style={{ height: 500, background: '#0d1117', borderRadius: 8, border: '1px solid #1c2333' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        attributionPosition="bottom-right"
      >
        <Background color="#1c2333" gap={24} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'thesis') return '#00ff88'
            if (n.type === 'effect') return n.data.order === 2 ? '#f59e0b' : '#8b5cf6'
            return '#3b82f6'
          }}
        />
      </ReactFlow>
    </div>
  )
}
