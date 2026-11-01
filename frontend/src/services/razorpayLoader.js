const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const fail = () => reject(new Error("Could not load the payment window. Please check your internet connection."));

    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", fail);
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = fail;
    document.body.appendChild(script);
  });