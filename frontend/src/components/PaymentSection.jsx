import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  createPaymentOrder,
  verifyPayment,
  syncPayment,
  markCashReceived,
} from "../services/paymentService";
import { loadRazorpay } from "../services/razorpayLoader";
import { getErrorMessage } from "../services/api";
import { formatPrice } from "../services/format";
import StatusBadge from "./StatusBadge";

export default function PaymentSection({ booking, role, onChanged }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Older bookings have no payment field yet, which means Unpaid
  const paymentStatus = booking.paymentStatus || "Unpaid";

  const payable =
    role === "customer" &&
    paymentStatus === "Unpaid" &&
    ["Accepted", "Completed"].includes(booking.status);

  // Load Razorpay's script ahead of time so the Pay button opens it instantly
  useEffect(() => {
    if (payable) loadRazorpay().catch(() => {});
  }, [payable]);

  // Nothing to show for these
  if (paymentStatus === "Unpaid" && ["Rejected", "Cancelled"].includes(booking.status)) return null;
  if (role === "beautician" && booking.status === "Pending") return null;

  const paidOn = booking.paidAt
    ? new Date(booking.paidAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const handlePay = async () => {
    setBusy(true);
    setError("");
    try {
      await loadRazorpay();
      const data = await createPaymentOrder(booking._id);

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Beautician Hub",
        description: booking.serviceTitle,
        order_id: data.order.id,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone ? `+91${user.phone}` : undefined,
        },
        theme: { color: "#da527e" },
        modal: {
          confirm_close: true,
          escape: false,
          backdropclose: false,
          ondismiss: () => setBusy(false),
        },
        handler: async (response) => {
          try {
            // The payment only counts once OUR server has verified it
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            onChanged();
          } catch (err) {
            setError(
              `${getErrorMessage(err)} If money was deducted, click "Check payment status".`
            );
          } finally {
            setBusy(false);
          }
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", (response) => {
        setError(response.error?.description || "The payment failed. You can try again.");
        setBusy(false);
      });
      checkout.open();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  const handleSync = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await syncPayment(booking._id);
      if (data.paid) toast.success(data.message);
      else toast(data.message, { duration: 6000 });
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCash = async () => {
    if (!window.confirm("Confirm that the customer paid you in cash?")) return;
    setBusy(true);
    setError("");
    try {
      await markCashReceived(booking._id);
      toast.success("Cash payment recorded");
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pay-box">
      <div className="pay-head">
        <strong>Payment</strong>
        <StatusBadge status={paymentStatus} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {paymentStatus === "Paid" && (
        <p className="pay-note">
          {booking.paymentMethod === "Cash" ? "Paid in cash to the beautician" : "Paid online"}
          {paidOn ? ` on ${paidOn}` : ""}. Amount: {formatPrice(booking.price)}
        </p>
      )}

      {paymentStatus === "Refunded" && (
        <p className="pay-note">
          {formatPrice(booking.price)} was refunded to the original payment method. Banks can take
          several business days to show it.
        </p>
      )}

      {role === "customer" && paymentStatus === "Unpaid" && booking.status === "Pending" && (
        <p className="pay-note">You can pay online once the beautician accepts your request.</p>
      )}

      {payable && (
        <div className="pay-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePay} disabled={busy}>
            {busy ? "Please wait..." : `Pay ${formatPrice(booking.price)} online`}
          </button>
          {booking.razorpayOrderId && (
            <button type="button" className="btn btn-outline btn-sm" onClick={handleSync} disabled={busy}>
              Check payment status
            </button>
          )}
          <span className="small text-muted">Or pay your beautician directly after the service.</span>
        </div>
      )}

      {role === "beautician" && paymentStatus === "Unpaid" && booking.status === "Accepted" && (
        <p className="pay-note">
          Not paid yet. The customer can pay online, or pay you directly after the service.
        </p>
      )}

      {role === "beautician" && paymentStatus === "Unpaid" && booking.status === "Completed" && (
        <div className="pay-actions">
          <span className="small text-muted">If the customer paid you in cash, record it here.</span>
          <button type="button" className="btn btn-plum btn-sm" onClick={handleCash} disabled={busy}>
            {busy ? "Saving..." : "Mark cash received"}
          </button>
        </div>
      )}
    </div>
  );
};