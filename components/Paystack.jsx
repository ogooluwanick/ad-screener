import React, { useRef } from 'react';
import { useRouter } from "next/navigation"; // Changed from next/router
import { PaystackButton } from 'react-paystack';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
// Removed axios and toast imports here, as they will be handled by the parent or passed as props

// Removed LoadingBox, PAY_FAIL, PAY_REQUEST, PAY_SUCCESS, getError as they are specific to the example's state management

/**
 * Paystack Payment Component (New Structure)
 *
 * Props:
 * - amountInKobo: number (Required: Amount to charge, in Kobo)
 * - metadata?: object (Optional: Metadata to pass to Paystack)
 * - onSuccess: (response) => void (Required: Callback function executed with Paystack's response upon successful payment)
 * - onClose?: () => void (Optional: Callback function executed when the Paystack modal is closed by the user)
 * - onInitiate?: () => void (Optional: Callback function executed when payment initiation attempt starts)
 * - isLoading?: boolean (Optional: Controls the loading state of the button, typically managed by the parent component)
 * - loadingText?: string (Optional: Text to display on the button when isLoading is true, e.g., "Processing...")
 * - className?: string (Optional: Custom CSS class for the main wrapper div)
 * - adDetailsForSubmission: object (Required: Contains title, description, etc. needed for submission AFTER successful payment)
 * - imageFileForSubmission: File | null (Required: The image file for submission)
 */
const Paystack = ({
  amountInKobo,
  metadata,
  onSuccess: parentOnSuccess, // Renamed to avoid conflict with PaystackButton's own onSuccess
  onClose: parentOnClose,
  onInitiate: parentOnInitiate,
  isLoading = false,
  loadingText = "Processing Payment...",
  className = '',
  // adDetailsForSubmission, // These will be handled by the parent component which has access to them
  // imageFileForSubmission, // Parent will handle this
}) => {
  const router = useRouter(); // Using next/navigation
  const { data: session } = useSession();
  // const paystackButtonRef = useRef(null); // No longer needed with direct PaystackButton usage

  if (!session || !session.user) {
    // This case should ideally be handled by the parent component by not rendering Paystack
    console.error("[Paystack.jsx - New] Session or user not available. This component should not be rendered.");
    return <div className={className}><p>Error: User session not found.</p></div>;
  }

  const paystackSuccessHandler = (paymentResult) => {
    console.log("[Paystack.jsx - New] paystackSuccessHandler called with result:", paymentResult);
    if (parentOnSuccess) {
      parentOnSuccess(paymentResult); // Pass the result to the parent's success handler
    }
  };

  const paystackOnCloseHandler = () => {
    console.log("[Paystack.jsx - New] paystackOnCloseHandler called.");
    if (parentOnClose) {
      parentOnClose();
    }
  };
            
  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: session?.user?.email || '', // Fallback to empty string if somehow null
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
    amount: amountInKobo, // Already in Kobo from props
    metadata: metadata || {},
  };

  const handleVisibleButtonClick = () => { 
    console.log("[Paystack.jsx - New] Visible button clicked. isLoading:", isLoading);
    // This function is now effectively part of the PaystackButton's direct click handling.
    // The `onInitiate` prop will be called before Paystack's modal is shown.
    // Validation of config should happen before rendering the button or disable it.
    // For simplicity, we assume parent ensures valid config before this point or Paystack handles it.
    // The PaystackButton itself will handle the initiation.
  };
        
  // The PaystackButton will be the visible button.
  // We apply isLoading state to its text and potentially disable it.
  // The `className` prop from parent can be applied to PaystackButton for styling.
  const buttonTextContent = isLoading ? (
    <span style={{ color: 'white' }}>{loadingText}</span>
  ) : (
    <>
      <svg width="20" height="20" viewBox="0 0 29 28" fill="none" style={{ marginRight: '8px' }}><path fillRule="evenodd" clipRule="evenodd" d="M1.51165 0H25.7369C26.5715 0 27.2504 0.671185 27.2504 1.50214V4.16909C27.2504 4.99651 26.5716 5.67141 25.7369 5.67141H1.51165C0.676996 5.67141 0 4.99657 0 4.16909V1.50214C0 0.671185 0.676996 0 1.51165 0ZM1.51165 14.887H25.7369C26.5715 14.887 27.2504 15.5599 27.2504 16.3874V19.058C27.2504 19.8854 26.5716 20.5566 25.7369 20.5566H1.51165C0.676996 20.5566 0 19.8854 0 19.058V16.3874C0 15.5599 0.676996 14.887 1.51165 14.887ZM15.1376 22.3304H1.51165C0.676996 22.3304 0 23.0016 0 23.8309V26.4997C0 27.3272 0.676996 28 1.51165 28H15.1377C15.9759 28 16.6511 27.3272 16.6511 26.4997V23.8309C16.6511 23.0016 15.9759 22.3304 15.1376 22.3304ZM1.51165 7.44171H27.2504C28.0868 7.44171 28.7619 8.11469 28.7619 8.94379V11.6127C28.7619 12.4401 28.0868 13.1148 27.2504 13.1148H1.51165C0.676996 13.1148 0 12.4401 0 11.6127V8.94379C0 8.11469 0.676996 7.44171 1.51165 7.44171Z" fill="white"></path></svg>
      <span style={{ color: 'white' }}>Pay with Paystack</span>
    </>
  );

  // Before rendering PaystackButton, call onInitiate if it exists and not already loading
  // This is a bit tricky as PaystackButton handles its own click.
  // The parent's onInitiate should ideally be called when the PaystackButton itself is clicked.
  // The PaystackButton doesn't have a direct pre-click hook other than its own internal logic.
  // We can wrap the PaystackButton in a div and attach onClick to that div to call onInitiate.

  const handleWrapperClick = () => {
    if (isLoading) {
      console.log("[Paystack.jsx - New] Wrapper click ignored, isLoading is true.");
      return;
    }
    // Validate essential configuration before initiating
    if (!paystackConfig.email || !paystackConfig.amount || !paystackConfig.publicKey) {
      const errorMessage = "Paystack configuration is incomplete. Please check email, amount, or public key.";
      console.error("[Paystack.jsx - New] Configuration error:", errorMessage);
      if (parentOnClose) parentOnClose(); // Trigger parent's close/reset logic
      // Potentially show a toast or error message here directly if an onError prop was designed for this
      return; // Stop before calling onInitiate or rendering the button that would fail
    }

    if (parentOnInitiate) {
      console.log("[Paystack.jsx - New] Calling parentOnInitiate from wrapper click.");
      parentOnInitiate();
    }
    // The actual PaystackButton below will then be clicked by the user.
  };


  // If config is bad, show an error message instead of the button
  if (!paystackConfig.email || !paystackConfig.amount || !paystackConfig.publicKey) {
    console.error("[Paystack.jsx - New] Rendering error due to incomplete Paystack config.");
    return (
      <div className={`${className} paystackBtn-container paystackBtn-error`} style={{ padding: '0.75rem 1.5rem', color: 'red', textAlign: 'center' }}>
        Paystack configuration error.
      </div>
    );
  }

  return (
    // The PaystackButton itself will be the main component.
    // We will pass a ReactNode to its 'text' prop for custom content.
    // The parentOnInitiate will be called when this button is clicked.
    <PaystackButton
      {...paystackConfig}
      onSuccess={paystackSuccessHandler}
      onClose={paystackOnCloseHandler}
      disabled={isLoading}
      className={`paystack-button-override ${className}`} // Add a specific class for overrides + parent class
      // The 'text' prop receives our custom button content.
      // We add an onClick to the content itself to trigger onInitiate.
      text={
        <div 
          onClick={() => {
            if (!isLoading && parentOnInitiate) {
              console.log("[Paystack.jsx - New] Custom button content clicked, calling parentOnInitiate.");
              parentOnInitiate();
            }
            // The PaystackButton's own onClick will still fire to open the modal.
          }}
          // Apply all visual styling to this div.
          // The PaystackButton component itself will be mostly transparent or minimal.
          style={{
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem 1.5rem',
            backgroundColor: isLoading ? '#A9A9A9' : '#00AB63', // Darker grey when loading
            color: 'white',
            borderRadius: '0.375rem',
            fontWeight: '500',
            opacity: isLoading ? 0.7 : 1,
            border: 'none',
            width: '100%', // Ensure full width
            textAlign: 'center', // Center text/icon
          }}
        >
          {isLoading ? (
            <span style={{ color: 'white' }}>{loadingText}</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 29 28" fill="none" style={{ marginRight: '8px' }}><path fillRule="evenodd" clipRule="evenodd" d="M1.51165 0H25.7369C26.5715 0 27.2504 0.671185 27.2504 1.50214V4.16909C27.2504 4.99651 26.5716 5.67141 25.7369 5.67141H1.51165C0.676996 5.67141 0 4.99657 0 4.16909V1.50214C0 0.671185 0.676996 0 1.51165 0ZM1.51165 14.887H25.7369C26.5715 14.887 27.2504 15.5599 27.2504 16.3874V19.058C27.2504 19.8854 26.5716 20.5566 25.7369 20.5566H1.51165C0.676996 20.5566 0 19.8854 0 19.058V16.3874C0 15.5599 0.676996 14.887 1.51165 14.887ZM15.1376 22.3304H1.51165C0.676996 22.3304 0 23.0016 0 23.8309V26.4997C0 27.3272 0.676996 28 1.51165 28H15.1377C15.9759 28 16.6511 27.3272 16.6511 26.4997V23.8309C16.6511 23.0016 15.9759 22.3304 15.1376 22.3304ZM1.51165 7.44171H27.2504C28.0868 7.44171 28.7619 8.11469 28.7619 8.94379V11.6127C28.7619 12.4401 28.0868 13.1148 27.2504 13.1148H1.51165C0.676996 13.1148 0 12.4401 0 11.6127V8.94379C0 8.11469 0.676996 7.44171 1.51165 7.44171Z" fill="white"></path></svg>
              <span style={{ color: 'white' }}>Pay with Paystack</span>
            </>
          )}
        </div>
      }
      // Apply minimal styling to the PaystackButton itself, making it a transparent overlay
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        margin: 0,
        width: '100%', // Make the button itself take full width to make the div clickable
        display: 'block', // Ensure it takes up block space
      }}
    />
  );
};

export default Paystack;
