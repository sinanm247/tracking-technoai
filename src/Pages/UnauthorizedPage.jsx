import { Link } from 'react-router-dom';
import Seo from '../Components/Common/Seo/Seo';

export default function UnauthorizedPage() {
  return (
    <>
      <Seo title="Unauthorized | TechnoAi Tracking" path="/unauthorized" />
      <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Unauthorized</h1>
          <p>You do not have permission to access this page.</p>
          <Link to="/">Back to tracking</Link>
        </div>
      </main>
    </>
  );
}
