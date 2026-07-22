import { formatLineCount, formatPoDate } from '../../../Utils/formatters';
import './TrackingResult.scss';

export default function TrackingResult({ order }) {
  return (
    <section className="tracking-result" aria-labelledby="tracking-result-title">
      <h2 id="tracking-result-title" className="tracking-result__po-number">
        PO number: {order.poNumber}
      </h2>

      <div className="tracking-result__status">
        <p className="tracking-result__status-label">
          PO Status: {order.poStatusPercent}%
        </p>
        <div
          className="tracking-result__progress"
          role="progressbar"
          aria-valuenow={order.poStatusPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`PO status ${order.poStatusPercent} percent`}
        >
          <div
            className="tracking-result__progress-fill"
            style={{ width: `${order.poStatusPercent}%` }}
          />
        </div>
      </div>

      <p className="tracking-result__line-count">
        Number of Lines: {order.numberOfLines || formatLineCount(order.items.length)}
      </p>

      <div className="tracking-result__table-wrap">
        <table className="tracking-result__table">
          <thead>
            <tr>
              <th scope="col">Line No</th>
              <th scope="col">Item Description</th>
              <th scope="col">Qty</th>
              <th scope="col">Status</th>
              <th scope="col">ETA</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.lineNo}>
                <td>{item.lineNo}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.status}</td>
                <td>{formatPoDate(item.eta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="tracking-result__po-closing-date">
        PO Closing date: {formatPoDate(order.poClosingDate)}
      </p>
    </section>
  );
}
