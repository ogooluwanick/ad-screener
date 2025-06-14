import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

/**
 * Paystack Payment Component
 *
 * Props:
 * - email?: string (User's email. If not provided, attempts to use email from active session)
 * - amountInKobo: number (Required: Amount to charge, in Kobo)
 * - metadata?: object (Optional: Metadata to pass to Paystack)
 * - onSuccess: (response) => void (Required: Callback function executed with Paystack's response upon successful payment)
 * - onClose?: () => void (Optional: Callback function executed when the Paystack modal is closed by the user)
 * - onError?: (error) => void (Optional: Callback for handling configuration errors or issues before payment initiation)
 * - onInitiate?: () => void (Optional: Callback function executed when payment initiation attempt starts, before Paystack modal)
 * - isLoading?: boolean (Optional: Controls the loading state of the button, typically managed by the parent component)
 * - loadingText?: string (Optional: Text to display on the button when isLoading is true, e.g., "Processing...")
 * - className?: string (Optional: Custom CSS class for the main wrapper div)
 */
const Paystack = ({
  email: propEmail,
  amountInKobo,
  metadata,
  onSuccess,
  onClose,
  onError,
  onInitiate, // New prop
  isLoading = false,
  loadingText = "Processing...", // Default loading text
  className = '',
}) => {
  const { data: session } = useSession();
  const userEmail = propEmail || (session?.user?.email);

  // Prepare Paystack configuration
  const paystackConfig = {
    reference: (new Date()).getTime().toString(), // Unique reference for each transaction
    email: userEmail,
    amount: amountInKobo, // Amount in Kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY, // Ensure this environment variable is set
    metadata: metadata || {}, // Optional metadata
  };

  // Initialize Paystack payment hook
  const initializePayment = usePaystackPayment(paystackConfig);

  // Wrapper for onSuccess callback from props
  const handleSuccessAfterPayment = (response) => {
    if (onSuccess) {
      onSuccess(response);
    }
  };

  // Wrapper for onClose callback from props
  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    }
  };

  // Handles the click event on the button to initiate payment
  const handlePaymentInitiation = () => {
    if (isLoading) return; // Do nothing if already loading

    // Call the onInitiate callback from parent to signal the start of the payment attempt
    // This allows the parent to set its own loading state for this button.
    if (onInitiate) {
      onInitiate();
    }

    // Validate essential configuration before initiating
    if (!userEmail || !amountInKobo || !process.env.NEXT_PUBLIC_PAYSTACK_KEY) {
      const errorMessage = "Paystack configuration is incomplete. Please check email, amount, or public key.";
      if (onError) {
        onError(new Error(errorMessage));
      } else {
        console.error(errorMessage); // Fallback error logging
      }
      // If onInitiate was called, the parent might have set isLoading.
      // If there's an error here, the parent's onClose or onError should ideally reset that.
      // For simplicity, we don't automatically call onClose here, parent should handle UI reset.
      return;
    }

    // Initiate Paystack's own payment modal/process
    initializePayment(handleSuccessAfterPayment, handleCloseModal);
  };

  return (
    <motion.div
      whileHover={{ scale: isLoading ? 1 : 1.015 }}
      whileTap={{ scale: isLoading ? 1 : 0.95 }}
      onClick={isLoading ? undefined : handlePaymentInitiation}
      className={`paystackBtn-container ${className}`} // Apply original and custom classes
      style={{ 
        cursor: isLoading ? 'not-allowed' : 'pointer', 
        display: 'inline-flex', 
        alignItems: 'center',    
        justifyContent: 'center', 
        padding: '0.75rem 1.5rem', // Adjusted padding for better appearance
        backgroundColor: '#00AB63', // Paystack green background
        color: 'white', // White text
        borderRadius: '0.375rem', // Rounded corners
        fontWeight: '500', // Medium font weight
        zIndex: 1050, // Increased z-index
        // Styling for the button itself (background, text color, border) should come from CSS classes like 'paystackBtn' or `className`
      }}
    >
      {isLoading ? (
        <span style={{ color: 'white' }}>{loadingText}</span>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 29 28" fill="none" style={{ marginRight: '8px' }}><path fillRule="evenodd" clipRule="evenodd" d="M1.51165 0H25.7369C26.5715 0 27.2504 0.671185 27.2504 1.50214V4.16909C27.2504 4.99651 26.5716 5.67141 25.7369 5.67141H1.51165C0.676996 5.67141 0 4.99657 0 4.16909V1.50214C0 0.671185 0.676996 0 1.51165 0ZM1.51165 14.887H25.7369C26.5715 14.887 27.2504 15.5599 27.2504 16.3874V19.058C27.2504 19.8854 26.5716 20.5566 25.7369 20.5566H1.51165C0.676996 20.5566 0 19.8854 0 19.058V16.3874C0 15.5599 0.676996 14.887 1.51165 14.887ZM15.1376 22.3304H1.51165C0.676996 22.3304 0 23.0016 0 23.8309V26.4997C0 27.3272 0.676996 28 1.51165 28H15.1377C15.9759 28 16.6511 27.3272 16.6511 26.4997V23.8309C16.6511 23.0016 15.9759 22.3304 15.1376 22.3304ZM1.51165 7.44171H27.2504C28.0868 7.44171 28.7619 8.11469 28.7619 8.94379V11.6127C28.7619 12.4401 28.0868 13.1148 27.2504 13.1148H1.51165C0.676996 13.1148 0 12.4401 0 11.6127V8.94379C0 8.11469 0.676996 7.44171 1.51165 7.44171Z" fill="white"></path></svg> {/* Changed fill to white for better contrast */}
          <span style={{ color: 'white' }}>Paystack</span> {/* Ensured text is white */}
        </>
      )}
    </motion.div>
  );
};

export default Paystack;
