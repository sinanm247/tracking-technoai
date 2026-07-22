import { useCallback, useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { toast } from 'react-toastify';
import { LINE_STATUSES, PO_STATUSES } from '../../../Constants/purchaseOrders';
import { ADMIN_ROLES, EDIT_ROLES } from '../../../Constants/roles';
import { useAuth } from '../../../Context/AuthContext';
import {
  addLineItem,
  createPurchaseOrder,
  deletePurchaseOrder,
  fetchPurchaseOrderActivity,
  fetchPurchaseOrderById,
  fetchPurchaseOrders,
  removeLineItem,
  updateLineItem,
  updatePurchaseOrder,
} from '../../../Services/purchaseOrderService';
import ConfirmToast from '../../../Design/ConfirmToast/ConfirmToast';
import ServerErrorState from '../../Common/ServerErrorState/ServerErrorState';
import { getFriendlyErrorMessage } from '../../../Api/api';
import { formatPoDate, formatRelativeActivityTime, toDateInputValue, toIsoDate } from '../../../Utils/formatters';
import './PurchaseOrders.scss';

const PANEL_CLOSE_MS = 320;
const PAGE_SIZE = 15;

const INITIAL_PO_FORM = {
  poNumber: '',
  soNumber: '',
  poDate: '',
  paymentTerms: '',
  plannedPoClosingDate: '',
  overallPoEta: '',
  clientName: '',
  salesPerson: '',
  subject: '',
  internalNotes: '',
};

const EMPTY_LINE = {
  lineNumber: '',
  description: '',
  quantity: '',
  unitPrice: '',
  status: 'Processing',
  eta: '',
  internalRemarks: '',
};

const poFormFromRecord = (po) => ({
  poNumber: po.poNumber || '',
  soNumber: po.soNumber || '',
  poDate: toDateInputValue(po.poDate),
  paymentTerms: po.paymentTerms || '',
  plannedPoClosingDate: toDateInputValue(po.plannedPoClosingDate),
  overallPoEta: toDateInputValue(po.overallPoEta),
  clientName: po.clientName || '',
  salesPerson: po.salesPerson || '',
  subject: po.subject || '',
  internalNotes: po.internalNotes || '',
});

const lineFormFromRecord = (line) => ({
  lineNumber: String(line.lineNumber ?? ''),
  description: line.description || '',
  quantity: String(line.quantity ?? ''),
  unitPrice: String(line.unitPrice ?? ''),
  status: line.status || 'Processing',
  eta: toDateInputValue(line.eta),
  internalRemarks: line.internalRemarks || '',
});

const buildLinePayload = (line) => ({
  lineNumber: Number(line.lineNumber),
  description: line.description.trim(),
  quantity: Number(line.quantity),
  unitPrice: line.unitPrice !== '' ? Number(line.unitPrice) : 0,
  status: line.status,
  eta: line.eta ? toIsoDate(line.eta) : undefined,
  internalRemarks: line.internalRemarks?.trim() || '',
});

export default function PurchaseOrders() {
  const { user } = useAuth();
  const canEdit = EDIT_ROLES.includes(user?.role);
  const canDelete = ADMIN_ROLES.includes(user?.role);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [panelMode, setPanelMode] = useState(null);
  const [selectedPo, setSelectedPo] = useState(null);
  const [detailTab, setDetailTab] = useState('lines');

  const [formData, setFormData] = useState(INITIAL_PO_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [createLines, setCreateLines] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [lineForm, setLineForm] = useState(EMPTY_LINE);
  const [lineFormMode, setLineFormMode] = useState(null);
  const [lineFormErrors, setLineFormErrors] = useState({});
  const [isLineSaving, setIsLineSaving] = useState(false);

  const [activity, setActivity] = useState([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetchPurchaseOrders({
        page,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        poStatus: statusFilter || undefined,
      });
      setPurchaseOrders(response.data || []);
      setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      setLoadError(getFriendlyErrorMessage(error, 'Unable to load purchase orders. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  useEffect(() => {
    if (!isPanelOpen) return undefined;
    const frame = requestAnimationFrame(() => setIsPanelActive(true));
    return () => cancelAnimationFrame(frame);
  }, [isPanelOpen]);

  const closePanel = () => {
    setIsPanelActive(false);
    window.setTimeout(() => {
      setIsPanelOpen(false);
      setPanelMode(null);
      setSelectedPo(null);
      setFormData(INITIAL_PO_FORM);
      setFormErrors({});
      setCreateLines([]);
      setLineForm(EMPTY_LINE);
      setLineFormMode(null);
      setLineFormErrors({});
      setActivity([]);
      setDetailTab('lines');
    }, PANEL_CLOSE_MS);
  };

  const openCreatePanel = () => {
    setPanelMode('create');
    setFormData(INITIAL_PO_FORM);
    setFormErrors({});
    setCreateLines([]);
    setIsPanelOpen(true);
  };

  const refreshSelectedPo = async (poId) => {
    const response = await fetchPurchaseOrderById(poId);
    setSelectedPo(response.data);
    return response.data;
  };

  const openDetailPanel = async (poId) => {
    try {
      const po = await refreshSelectedPo(poId);
      setSelectedPo(po);
      setPanelMode('detail');
      setDetailTab('lines');
      setIsPanelOpen(true);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to load purchase order.'));
    }
  };

  const openEditPanel = () => {
    if (!selectedPo) return;
    setFormData(poFormFromRecord(selectedPo));
    setFormErrors({});
    setPanelMode('edit');
  };

  const loadActivity = async (poId) => {
    setIsActivityLoading(true);
    try {
      const response = await fetchPurchaseOrderActivity(poId, { limit: 50 });
      setActivity(response.data || []);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to load activity.'));
    } finally {
      setIsActivityLoading(false);
    }
  };

  useEffect(() => {
    if (panelMode === 'detail' && detailTab === 'activity' && selectedPo?._id) {
      loadActivity(selectedPo._id);
    }
  }, [panelMode, detailTab, selectedPo?._id]);

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validatePoForm = () => {
    const errors = {};
    if (!formData.poNumber.trim()) errors.poNumber = 'PO number is required';
    if (!formData.soNumber.trim()) errors.soNumber = 'SO number is required';
    if (!formData.poDate) errors.poDate = 'PO date is required';
    if (!formData.clientName.trim()) errors.clientName = 'Client name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPoPayload = (includeLines = false) => {
    const payload = {
      poNumber: formData.poNumber.trim(),
      soNumber: formData.soNumber.trim(),
      poDate: toIsoDate(formData.poDate),
      paymentTerms: formData.paymentTerms.trim(),
      clientName: formData.clientName.trim(),
      salesPerson: formData.salesPerson.trim(),
      subject: formData.subject.trim(),
      internalNotes: formData.internalNotes.trim(),
    };

    if (formData.plannedPoClosingDate) {
      payload.plannedPoClosingDate = toIsoDate(formData.plannedPoClosingDate);
    }
    if (formData.overallPoEta) {
      payload.overallPoEta = toIsoDate(formData.overallPoEta);
    }

    if (includeLines && createLines.length > 0) {
      payload.lines = createLines.map(buildLinePayload);
    }

    return payload;
  };

  const handleCreatePo = async (event) => {
    event.preventDefault();
    if (!validatePoForm()) return;

    setIsSaving(true);
    try {
      await createPurchaseOrder(buildPoPayload(true));
      toast.success('Purchase order created successfully');
      closePanel();
      loadPurchaseOrders();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to create purchase order.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePo = async (event) => {
    event.preventDefault();
    if (!validatePoForm() || !selectedPo) return;

    setIsSaving(true);
    try {
      await updatePurchaseOrder(selectedPo._id, buildPoPayload(false));
      toast.success('Purchase order updated successfully');
      await refreshSelectedPo(selectedPo._id);
      setPanelMode('detail');
      loadPurchaseOrders();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to update purchase order.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePo = (poId) => {
    setConfirmDialog({
      title: 'Delete purchase order',
      message: 'Delete this purchase order permanently? All line items and activity history will be removed.',
      confirmLabel: 'Delete',
      action: async () => {
        try {
          await deletePurchaseOrder(poId);
          toast.success('Purchase order deleted');
          if (selectedPo?._id === poId) closePanel();
          loadPurchaseOrders();
        } catch (error) {
          toast.error(getFriendlyErrorMessage(error, 'Failed to delete purchase order.'));
        }
      },
    });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    loadPurchaseOrders();
  };

  const handleCreateLineChange = (index, field) => (event) => {
    setCreateLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: event.target.value };
      return next;
    });
  };

  const addCreateLineRow = () => {
    setCreateLines((prev) => [...prev, { ...EMPTY_LINE, lineNumber: String((prev.length + 1) * 10) }]);
  };

  const removeCreateLineRow = (index) => {
    setCreateLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineFormChange = (field) => (event) => {
    setLineForm((prev) => ({ ...prev, [field]: event.target.value }));
    setLineFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateLineForm = () => {
    const errors = {};
    if (!lineForm.lineNumber) errors.lineNumber = 'Line number is required';
    if (!lineForm.description.trim()) errors.description = 'Description is required';
    if (lineForm.quantity === '' || Number(lineForm.quantity) < 0) {
      errors.quantity = 'Valid quantity is required';
    }
    setLineFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const startAddLine = () => {
    const nextLineNumber = selectedPo?.lines?.length
      ? Math.max(...selectedPo.lines.map((l) => l.lineNumber)) + 10
      : 10;
    setLineForm({ ...EMPTY_LINE, lineNumber: String(nextLineNumber) });
    setLineFormMode('add');
    setLineFormErrors({});
  };

  const startEditLine = (line) => {
    setLineForm(lineFormFromRecord(line));
    setLineFormMode('edit');
    setLineFormErrors({});
  };

  const cancelLineForm = () => {
    setLineForm(EMPTY_LINE);
    setLineFormMode(null);
    setLineFormErrors({});
  };

  const handleSaveLine = async (event) => {
    event.preventDefault();
    if (!validateLineForm() || !selectedPo) return;

    setIsLineSaving(true);
    try {
      const payload = buildLinePayload(lineForm);

      if (lineFormMode === 'add') {
        await addLineItem(selectedPo._id, payload);
        toast.success('Line item added');
      } else {
        await updateLineItem(selectedPo._id, Number(lineForm.lineNumber), payload);
        toast.success('Line item updated');
      }

      await refreshSelectedPo(selectedPo._id);
      loadPurchaseOrders();
      cancelLineForm();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to save line item.'));
    } finally {
      setIsLineSaving(false);
    }
  };

  const handleRemoveLine = (lineNumber) => {
    if (!selectedPo) return;

    setConfirmDialog({
      title: 'Remove line item',
      message: `Remove line ${lineNumber} from this purchase order? This action cannot be undone.`,
      confirmLabel: 'Remove',
      action: async () => {
        try {
          await removeLineItem(selectedPo._id, lineNumber);
          toast.success('Line item removed');
          await refreshSelectedPo(selectedPo._id);
          loadPurchaseOrders();
        } catch (error) {
          toast.error(getFriendlyErrorMessage(error, 'Failed to remove line item.'));
        }
      },
    });
  };

  const renderPoFormFields = () => (
    <div className="po-management__form-grid">
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="poNumber">PO number</label>
        <input id="poNumber" className="po-management__input" value={formData.poNumber} onChange={handleFormChange('poNumber')} />
        {formErrors.poNumber && <p className="po-management__error">{formErrors.poNumber}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="soNumber">SO number</label>
        <input id="soNumber" className="po-management__input" value={formData.soNumber} onChange={handleFormChange('soNumber')} />
        {formErrors.soNumber && <p className="po-management__error">{formErrors.soNumber}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="poDate">PO date</label>
        <input id="poDate" type="date" className="po-management__input" value={formData.poDate} onChange={handleFormChange('poDate')} />
        {formErrors.poDate && <p className="po-management__error">{formErrors.poDate}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="clientName">Client name</label>
        <input id="clientName" className="po-management__input" value={formData.clientName} onChange={handleFormChange('clientName')} />
        {formErrors.clientName && <p className="po-management__error">{formErrors.clientName}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="salesPerson">Sales person</label>
        <input id="salesPerson" className="po-management__input" value={formData.salesPerson} onChange={handleFormChange('salesPerson')} />
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="paymentTerms">Payment terms</label>
        <input id="paymentTerms" className="po-management__input" value={formData.paymentTerms} onChange={handleFormChange('paymentTerms')} />
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="plannedPoClosingDate">Planned closing date</label>
        <input id="plannedPoClosingDate" type="date" className="po-management__input" value={formData.plannedPoClosingDate} onChange={handleFormChange('plannedPoClosingDate')} />
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="overallPoEta">Overall PO ETA</label>
        <input id="overallPoEta" type="date" className="po-management__input" value={formData.overallPoEta} onChange={handleFormChange('overallPoEta')} />
      </div>
      <div className="po-management__field po-management__field--full">
        <label className="po-management__label" htmlFor="subject">Subject</label>
        <input id="subject" className="po-management__input" value={formData.subject} onChange={handleFormChange('subject')} />
      </div>
      <div className="po-management__field po-management__field--full">
        <label className="po-management__label" htmlFor="internalNotes">Internal notes</label>
        <textarea id="internalNotes" className="po-management__textarea" rows={3} value={formData.internalNotes} onChange={handleFormChange('internalNotes')} />
      </div>
    </div>
  );

  const renderLineFormFields = ({
    prefix = 'line',
    line,
    onChange,
    errors = {},
    disableLineNumber = false,
  }) => (
    <div className="po-management__line-form-grid">
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-lineNumber`}>Line #</label>
        <input
          id={`${prefix}-lineNumber`}
          className="po-management__input"
          value={line.lineNumber}
          onChange={onChange('lineNumber')}
          disabled={disableLineNumber}
        />
        {errors.lineNumber && <p className="po-management__error">{errors.lineNumber}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-quantity`}>Quantity</label>
        <input id={`${prefix}-quantity`} type="number" min="0" className="po-management__input" value={line.quantity} onChange={onChange('quantity')} />
        {errors.quantity && <p className="po-management__error">{errors.quantity}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-unitPrice`}>Unit price</label>
        <input id={`${prefix}-unitPrice`} type="number" min="0" step="0.01" className="po-management__input" value={line.unitPrice} onChange={onChange('unitPrice')} />
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-status`}>Status</label>
        <select id={`${prefix}-status`} className="po-management__select" value={line.status} onChange={onChange('status')}>
          {LINE_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      <div className="po-management__field po-management__field--full">
        <label className="po-management__label" htmlFor={`${prefix}-description`}>Description</label>
        <input id={`${prefix}-description`} className="po-management__input" value={line.description} onChange={onChange('description')} />
        {errors.description && <p className="po-management__error">{errors.description}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-eta`}>ETA</label>
        <input id={`${prefix}-eta`} type="date" className="po-management__input" value={line.eta} onChange={onChange('eta')} />
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-remarks`}>Internal remarks</label>
        <input id={`${prefix}-remarks`} className="po-management__input" value={line.internalRemarks} onChange={onChange('internalRemarks')} />
      </div>
    </div>
  );

  const panelTitle = {
    create: 'Create Purchase Order',
    edit: 'Edit Purchase Order',
    detail: selectedPo ? `PO ${selectedPo.poNumber}` : 'Purchase Order',
  }[panelMode] || '';

  const isWidePanel = panelMode === 'detail' || panelMode === 'create';

  return (
    <section className="po-management">
      <div className="po-management__head">
        <div>
          <h1 className="po-management__title">Purchase Orders</h1>
          <p className="po-management__subtitle">
            Manage purchase orders, line items, and shipment status.
          </p>
        </div>
        {canEdit && (
          <button type="button" className="po-management__add-btn" onClick={openCreatePanel}>
            + Create PO
          </button>
        )}
      </div>

      <form className="po-management__filters" onSubmit={handleSearch}>
        <input
          className="po-management__search"
          placeholder="Search PO, SO, client, subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="po-management__select po-management__filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {PO_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button type="submit" className="po-management__search-btn">Search</button>
      </form>

      {loadError ? (
        <ServerErrorState message={loadError} onRetry={loadPurchaseOrders} retryLabel="Try again" />
      ) : (
        <div className="po-management__table-wrap">
          {isLoading ? (
            <div className="po-management__state">
              <div className="po-management__loader" aria-hidden />
              <p>Loading purchase orders...</p>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <p className="po-management__empty">No purchase orders found.</p>
          ) : (
            <table className="po-management__table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>SO Number</th>
                  <th>Client</th>
                  <th>PO Date</th>
                  <th>Status</th>
                  <th>Lines</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po._id}>
                    <td>{po.poNumber}</td>
                    <td>{po.soNumber}</td>
                    <td>{po.clientName}</td>
                    <td>{formatPoDate(po.poDate)}</td>
                    <td>
                      <span className={`po-management__badge${po.poStatus === 'Closed' ? ' is-closed' : ''}`}>
                        {po.poStatus}
                      </span>
                    </td>
                    <td>{po.numberOfLines ?? po.lines?.length ?? 0}</td>
                    <td>
                      <div className="po-management__actions">
                        <button type="button" className="po-management__action-btn" onClick={() => openDetailPanel(po._id)}>
                          View
                        </button>
                        {canDelete && (
                          <button type="button" className="po-management__action-btn is-danger" onClick={() => handleDeletePo(po._id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="po-management__pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {isPanelOpen && (
        <>
          <div className={`po-management__panel-overlay${isPanelActive ? ' is-active' : ''}`} onClick={closePanel} role="presentation" />
          <aside className={`po-management__panel${isPanelActive ? ' is-active' : ''}${isWidePanel ? ' is-wide' : ''}`}>
            <div className="po-management__panel-header">
              <h2 className="po-management__panel-title">{panelTitle}</h2>
              <button type="button" className="po-management__panel-close" onClick={closePanel} aria-label="Close panel">
                <IoMdClose size={22} />
              </button>
            </div>

            {(panelMode === 'create' || panelMode === 'edit') && (
              <form onSubmit={panelMode === 'create' ? handleCreatePo : handleUpdatePo}>
                {renderPoFormFields()}

                {panelMode === 'create' && (
                  <div className="po-management__lines-section">
                    <div className="po-management__lines-head">
                      <h3 className="po-management__section-title">Line items (optional)</h3>
                      <button type="button" className="po-management__action-btn" onClick={addCreateLineRow}>
                        + Add line item
                      </button>
                    </div>
                    {createLines.map((line, index) => (
                      <div key={index} className="po-management__line-form">
                        <div className="po-management__line-form-header">
                          <h4 className="po-management__section-title">Line item {index + 1}</h4>
                          <button
                            type="button"
                            className="po-management__action-btn is-danger"
                            onClick={() => removeCreateLineRow(index)}
                          >
                            Remove
                          </button>
                        </div>
                        {renderLineFormFields({
                          prefix: `create-line-${index}`,
                          line,
                          onChange: (field) => handleCreateLineChange(index, field),
                        })}
                      </div>
                    ))}
                  </div>
                )}

                <div className="po-management__panel-actions">
                  {panelMode === 'edit' && (
                    <button type="button" className="po-management__cancel-btn" onClick={() => setPanelMode('detail')}>
                      Back
                    </button>
                  )}
                  {panelMode === 'create' && (
                    <button type="button" className="po-management__cancel-btn" onClick={closePanel}>Cancel</button>
                  )}
                  <button type="submit" className="po-management__save-btn" disabled={isSaving}>
                    {isSaving ? 'Saving...' : panelMode === 'create' ? 'Create PO' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {panelMode === 'detail' && selectedPo && (
              <div className="po-management__detail">
                <div className="po-management__detail-header">
                  <div className="po-management__detail-meta">
                    <span className={`po-management__badge${selectedPo.poStatus === 'Closed' ? ' is-closed' : ''}`}>
                      {selectedPo.poStatus}
                    </span>
                    <span className="po-management__detail-text">{selectedPo.clientName}</span>
                    <span className="po-management__detail-text">SO: {selectedPo.soNumber}</span>
                  </div>
                  {canEdit && (
                    <button type="button" className="po-management__action-btn" onClick={openEditPanel}>
                      Edit header
                    </button>
                  )}
                </div>

                <div className="po-management__info-grid">
                  <div><span>PO Date</span><strong>{formatPoDate(selectedPo.poDate)}</strong></div>
                  <div><span>Overall ETA</span><strong>{formatPoDate(selectedPo.overallPoEta)}</strong></div>
                  <div><span>Planned closing</span><strong>{formatPoDate(selectedPo.plannedPoClosingDate)}</strong></div>
                  <div><span>Actual closing</span><strong>{formatPoDate(selectedPo.actualPoClosingDate)}</strong></div>
                  <div><span>Sales person</span><strong>{selectedPo.salesPerson || '—'}</strong></div>
                  <div><span>Payment terms</span><strong>{selectedPo.paymentTerms || '—'}</strong></div>
                  <div className="po-management__info-full"><span>Subject</span><strong>{selectedPo.subject || '—'}</strong></div>
                  <div className="po-management__info-full"><span>Internal notes</span><strong>{selectedPo.internalNotes || '—'}</strong></div>
                </div>

                <div className="po-management__tabs">
                  <button type="button" className={`po-management__tab${detailTab === 'lines' ? ' is-active' : ''}`} onClick={() => setDetailTab('lines')}>Line items</button>
                  <button type="button" className={`po-management__tab${detailTab === 'activity' ? ' is-active' : ''}`} onClick={() => setDetailTab('activity')}>Activity</button>
                </div>

                {detailTab === 'lines' && (
                  <div className="po-management__lines-section">
                    {canEdit && !lineFormMode && (
                      <button type="button" className="po-management__action-btn" onClick={startAddLine}>
                        + Add line item
                      </button>
                    )}

                    {lineFormMode && (
                      <form className="po-management__line-form" onSubmit={handleSaveLine}>
                        <h4 className="po-management__section-title">
                          {lineFormMode === 'add' ? 'Add line item' : `Edit line ${lineForm.lineNumber}`}
                        </h4>
                        {renderLineFormFields({
                          prefix: 'detail-line',
                          line: lineForm,
                          onChange: handleLineFormChange,
                          errors: lineFormErrors,
                          disableLineNumber: lineFormMode === 'edit',
                        })}
                        <div className="po-management__line-form-actions">
                          <button type="button" className="po-management__cancel-btn" onClick={cancelLineForm}>Cancel</button>
                          <button type="submit" className="po-management__save-btn" disabled={isLineSaving}>
                            {isLineSaving ? 'Saving...' : 'Save line'}
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="po-management__table-wrap po-management__table-wrap--nested">
                      <table className="po-management__table">
                        <thead>
                          <tr>
                            <th>Line #</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Status</th>
                            <th>ETA</th>
                            {canEdit && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedPo.lines || []).length === 0 ? (
                            <tr><td colSpan={canEdit ? 6 : 5}>No line items yet.</td></tr>
                          ) : (
                            selectedPo.lines.map((line) => (
                              <tr key={line._id || line.lineNumber}>
                                <td>{line.lineNumber}</td>
                                <td>{line.description}</td>
                                <td>{line.quantity}</td>
                                <td><span className="po-management__badge">{line.status}</span></td>
                                <td>{formatPoDate(line.eta)}</td>
                                {canEdit && (
                                  <td>
                                    <div className="po-management__actions">
                                      <button type="button" className="po-management__action-btn" onClick={() => startEditLine(line)}>Edit</button>
                                      <button type="button" className="po-management__action-btn is-danger" onClick={() => handleRemoveLine(line.lineNumber)}>Remove</button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {detailTab === 'activity' && (
                  <div className="po-management__activity">
                    {isActivityLoading ? (
                      <p className="po-management__empty">Loading activity...</p>
                    ) : activity.length === 0 ? (
                      <p className="po-management__empty">No activity recorded yet.</p>
                    ) : (
                      <ul className="po-management__activity-list">
                        {activity.map((entry) => (
                          <li key={entry._id} className="po-management__activity-item">
                            <div className="po-management__activity-top">
                              <strong>{entry.action?.replace(/_/g, ' ')}</strong>
                              <span>{formatRelativeActivityTime(entry.createdAt)}</span>
                            </div>
                            <p>{entry.description}</p>
                            {entry.performedByName && (
                              <span className="po-management__activity-by">By {entry.performedByName}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        </>
      )}

      {confirmDialog && (
        <ConfirmToast
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={() => {
            confirmDialog.action();
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </section>
  );
}
