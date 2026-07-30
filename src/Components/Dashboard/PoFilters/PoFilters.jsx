import { useEffect, useState } from 'react';
import { LINE_CURRENCIES, PO_STATUSES } from '../../../Constants/purchaseOrders';
import { fetchPurchaseOrderFilterOptions } from '../../../Services/purchaseOrderService';
import { INITIAL_PO_FILTERS } from '../../../Utils/poFilters';
import './PoFilters.scss';

export default function PoFilters({
  filters,
  onChange,
  onApply,
  onReset,
  mode = 'search',
  showActions = true,
}) {
  const [options, setOptions] = useState({
    salesPersons: [],
    clientNames: [],
    suppliers: [],
    countries: [],
  });

  useEffect(() => {
    fetchPurchaseOrderFilterOptions()
      .then((response) => setOptions(response.data || {}))
      .catch(() => {});
  }, []);

  const isDisabled = filters.allPos;

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;
    onChange({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onChange({ ...INITIAL_PO_FILTERS });
    onReset?.();
  };

  const isReporting = mode === 'reporting';

  return (
    <form className="po-filters" onSubmit={onApply}>
      <div className="po-filters__grid">
        <div className="po-filters__field">
          <label className="po-filters__label" htmlFor="filter-date-from">Date from</label>
          <input
            id="filter-date-from"
            type="date"
            className="po-filters__input"
            value={filters.dateFrom}
            onChange={handleChange('dateFrom')}
            disabled={isDisabled}
          />
        </div>

        <div className="po-filters__field">
          <label className="po-filters__label" htmlFor="filter-date-to">Date to</label>
          <input
            id="filter-date-to"
            type="date"
            className="po-filters__input"
            value={filters.dateTo}
            onChange={handleChange('dateTo')}
            disabled={isDisabled}
          />
        </div>

        <div className="po-filters__field">
          <label className="po-filters__label" htmlFor="filter-sales-person">Sales person</label>
          <select
            id="filter-sales-person"
            className="po-filters__select"
            value={filters.salesPerson}
            onChange={handleChange('salesPerson')}
            disabled={isDisabled}
          >
            <option value="">All sales persons</option>
            {options.salesPersons.map((person) => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </div>

        <div className="po-filters__field">
          <label className="po-filters__label" htmlFor="filter-client-name">Client name</label>
          <select
            id="filter-client-name"
            className="po-filters__select"
            value={filters.clientName}
            onChange={handleChange('clientName')}
            disabled={isDisabled}
          >
            <option value="">All clients</option>
            {options.clientNames.map((client) => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
        </div>

        <div className="po-filters__field">
          <label className="po-filters__label" htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            className="po-filters__select"
            value={filters.status}
            onChange={handleChange('status')}
            disabled={isDisabled}
          >
            <option value="">Open or closed</option>
            {PO_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="po-filters__field">
          <label className="po-filters__label" htmlFor="filter-upcoming-closing">
            Upcoming closing PO by date
          </label>
          <input
            id="filter-upcoming-closing"
            type="date"
            className="po-filters__input"
            value={filters.upcomingClosingBy}
            onChange={handleChange('upcomingClosingBy')}
            disabled={isDisabled}
          />
        </div>

        <div className="po-filters__field po-filters__field--checkbox">
          <label className="po-filters__checkbox-label">
            <input
              type="checkbox"
              checked={filters.allPos}
              onChange={handleChange('allPos')}
            />
            All POs
          </label>
        </div>

        {isReporting && (
          <>
            <div className="po-filters__field">
              <label className="po-filters__label" htmlFor="filter-supplier">Supplier</label>
              <select
                id="filter-supplier"
                className="po-filters__select"
                value={filters.supplier}
                onChange={handleChange('supplier')}
                disabled={isDisabled}
              >
                <option value="">All suppliers</option>
                {options.suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>

            <div className="po-filters__field">
              <label className="po-filters__label" htmlFor="filter-country">Country</label>
              <select
                id="filter-country"
                className="po-filters__select"
                value={filters.country}
                onChange={handleChange('country')}
                disabled={isDisabled}
              >
                <option value="">All countries</option>
                {options.countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="po-filters__field">
              <label className="po-filters__label" htmlFor="filter-currency">Currency</label>
              <select
                id="filter-currency"
                className="po-filters__select"
                value={filters.currency}
                onChange={handleChange('currency')}
                disabled={isDisabled}
              >
                <option value="">All currencies</option>
                {LINE_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div className="po-filters__field">
              <label className="po-filters__label" htmlFor="filter-po-number">PO number</label>
              <input
                id="filter-po-number"
                className="po-filters__input"
                value={filters.poNumber}
                onChange={handleChange('poNumber')}
                disabled={isDisabled}
                placeholder="PO number"
              />
            </div>

            <div className="po-filters__field">
              <label className="po-filters__label" htmlFor="filter-so-number">SO number</label>
              <input
                id="filter-so-number"
                className="po-filters__input"
                value={filters.soNumber}
                onChange={handleChange('soNumber')}
                disabled={isDisabled}
                placeholder="SO number"
              />
            </div>

            <div className="po-filters__field">
              <label className="po-filters__label" htmlFor="filter-contact-person">Contact person</label>
              <input
                id="filter-contact-person"
                className="po-filters__input"
                value={filters.contactPerson}
                onChange={handleChange('contactPerson')}
                disabled={isDisabled}
                placeholder="Contact person"
              />
            </div>
          </>
        )}
      </div>

      {showActions && (
        <div className="po-filters__actions">
          <button type="button" className="po-filters__reset-btn" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="po-filters__apply-btn">
            Apply filters
          </button>
        </div>
      )}
    </form>
  );
}
