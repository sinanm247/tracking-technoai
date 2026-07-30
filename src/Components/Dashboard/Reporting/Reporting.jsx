import { useCallback, useEffect, useState } from 'react';
import { fetchPurchaseOrders } from '../../../Services/purchaseOrderService';
import { getFriendlyErrorMessage } from '../../../Api/api';
import { formatPoDate } from '../../../Utils/formatters';
import { buildPoFilterParams, INITIAL_PO_FILTERS } from '../../../Utils/poFilters';
import ServerErrorState from '../../Common/ServerErrorState/ServerErrorState';
import PoFilters from '../PoFilters/PoFilters';
import './Reporting.scss';

const PAGE_SIZE = 20;

export default function Reporting() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(INITIAL_PO_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_PO_FILTERS);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetchPurchaseOrders(
        buildPoFilterParams(appliedFilters, page, PAGE_SIZE),
      );
      setPurchaseOrders(response.data || []);
      setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      setLoadError(getFriendlyErrorMessage(error, 'Unable to load reporting data. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setPage(1);
    setAppliedFilters(INITIAL_PO_FILTERS);
  };

  return (
    <section className="reporting">
      <div className="reporting__head">
        <div>
          <h1 className="reporting__title">Reporting</h1>
          <p className="reporting__subtitle">
            Filter and review purchase orders for operational reporting.
          </p>
        </div>
        <span className="reporting__count">{pagination.total ?? 0} results</span>
      </div>

      <PoFilters
        mode="reporting"
        filters={filters}
        onChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {loadError ? (
        <ServerErrorState message={loadError} onRetry={loadReport} retryLabel="Try again" />
      ) : (
        <div className="reporting__table-wrap">
          {isLoading ? (
            <div className="reporting__state">
              <div className="reporting__loader" aria-hidden />
              <p>Loading report...</p>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <p className="reporting__empty">No purchase orders match the selected filters.</p>
          ) : (
            <table className="reporting__table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>SO Number</th>
                  <th>Client</th>
                  <th>Sales person</th>
                  <th>Contact person</th>
                  <th>PO Date</th>
                  <th>Overall ETA</th>
                  <th>Status</th>
                  <th>Lines</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po._id}>
                    <td>{po.poNumber}</td>
                    <td>{po.soNumber}</td>
                    <td>{po.clientName}</td>
                    <td>{po.salesPerson || '—'}</td>
                    <td>{po.contactPerson || '—'}</td>
                    <td>{formatPoDate(po.poDate)}</td>
                    <td>{formatPoDate(po.overallPoEta)}</td>
                    <td>
                      <span className={`reporting__badge${po.poStatus === 'Closed' ? ' is-closed' : ''}`}>
                        {po.poStatus}
                      </span>
                    </td>
                    <td>{po.numberOfLines ?? po.lines?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="reporting__pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
