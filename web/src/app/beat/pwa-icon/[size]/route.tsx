import { ImageResponse } from 'next/og';

export async function GET(_request: Request, {params}: {params: Promise<{size: string}>}) {
  const {size} = await params;
  if (size !== '192' && size !== '512') return new Response(null, {status:404});
  const n = Number(size);
  return new ImageResponse(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',background:'#07080a'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:n*.58,height:n*.58,borderRadius:n*.14,background:'#fff',color:'#07080a',fontSize:n*.42,fontWeight:800}}>B</div>
    </div>, {width:n,height:n,headers:{'Cache-Control':'public, max-age=86400'}}
  );
}
