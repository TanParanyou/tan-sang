import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: '#E11D48',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '7px',
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        ต
      </div>
    ),
    {
      ...size,
    }
  );
}
