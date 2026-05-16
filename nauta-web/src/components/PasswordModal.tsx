// src/components/PasswordModal.tsx  (stub temporal)
export default function PasswordModal({ onClose }: { onClose: () => void; session: unknown; onSuccess: (m: string) => void }) {
  return <div onClick={onClose} style={{position:'fixed',inset:0,background:'#000a',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
    <div style={{background:'#0f1923',border:'1px solid #1a2e3d',borderRadius:16,padding:24,color:'#c8dde8',fontFamily:'monospace'}}>
      PasswordModal — próximamente
    </div>
  </div>
}