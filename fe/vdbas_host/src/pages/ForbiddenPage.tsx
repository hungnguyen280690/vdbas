import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorPage: React.FC<{
  code: string;
  title: string;
  description: string;
}> = ({ code, title, description }) => {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 400,
      gap: 16,
      padding: 40,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 64,
        fontWeight: 700,
        color: 'var(--border-2)',
        fontFamily: 'var(--font-mono)',
        lineHeight: 1,
      }}>
        {code}
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, margin: 0 }}>
        {description}
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 20px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 8,
          transition: 'all var(--transition)',
        }}
      >
        ← Quay lại
      </button>
    </div>
  );
};

export const ForbiddenPage: React.FC = () => (
  <ErrorPage
    code="403"
    title="Không có quyền truy cập"
    description="Bạn không có quyền xem trang này. Liên hệ quản trị viên nếu cần cấp quyền."
  />
);

export const NotFoundPage: React.FC = () => (
  <ErrorPage
    code="404"
    title="Không tìm thấy trang"
    description="Trang bạn tìm kiếm không tồn tại hoặc đã bị xoá."
  />
);
