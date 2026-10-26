import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'ตาลสั่ง (Tan-Sang) — ระบบเปิดบิลสั่งอาหารกลุ่มผ่าน LINE';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAFA',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, #E5E5E5 2%, transparent 0%), radial-gradient(circle at 75px 75px, #E5E5E5 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E11D48',
              borderRadius: '20px',
              padding: '16px 28px',
              color: 'white',
              fontSize: 42,
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(225, 29, 72, 0.25)',
            }}
          >
            ตาลสั่ง
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#171717',
              letterSpacing: '-0.02em',
            }}
          >
            Tan-Sang
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          <h1
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: '#0A0A0A',
              lineHeight: 1.25,
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}
          >
            ระบบเปิดบิลสั่งอาหารกลุ่มผ่าน LINE
          </h1>
          <p
            style={{
              fontSize: 26,
              color: '#525252',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            เลือกเมนูและท็อปปิ้ง แยกบิลรายคน คัดลอกสรุปส่งร้านค้าได้ในคลิกเดียว
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginTop: '48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderRadius: '100px',
              padding: '10px 24px',
              fontSize: 20,
              fontWeight: 600,
              color: '#171717',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            📱 LINE LIFF & Bot
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderRadius: '100px',
              padding: '10px 24px',
              fontSize: 20,
              fontWeight: 600,
              color: '#171717',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            ⚡ รวมรายการซ้ำส่งร้านทันที
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderRadius: '100px',
              padding: '10px 24px',
              fontSize: 20,
              fontWeight: 600,
              color: '#171717',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            💰 แยกยอดตามคนหารง่าย
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
