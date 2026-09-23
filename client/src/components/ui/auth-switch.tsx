"use client";

import { useState, type FormEvent } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export interface AuthSwitchProps {
  initialSignUp?: boolean;
  onSignInSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onSignUpSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  isLoading?: boolean;
}

export default function AuthSwitch({
  initialSignUp = false,
  onSignInSubmit,
  onSignUpSubmit,
  onGoogleSignIn,
  isLoading = false,
}: AuthSwitchProps) {
  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const handleSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSignInSubmit) {
      onSignInSubmit(event);
    }
  };

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSignUpSubmit) {
      onSignUpSubmit(event);
    }
  };

  return (
    <div className="auth-switch">
      <style>{`
        .auth-switch,
        .auth-switch * {
          box-sizing: border-box;
        }

        .auth-switch {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .container {
          position: relative;
          width: 100%;
          max-width: 900px;
          height: 550px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 5rem;
          transition: all 0.2s 0.7s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
        }

        form.sign-up-form {
          opacity: 0;
          z-index: 1;
        }

        form.sign-in-form {
          z-index: 2;
        }

        .title {
          font-size: 2.2rem;
          color: #444;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .input-field {
          max-width: 380px;
          width: 100%;
          background-color: #f1f5f9;
          margin: 10px 0;
          height: 55px;
          border-radius: 55px;
          display: flex;
          align-items: center;
          padding: 0 1.25rem;
          position: relative;
          transition: all 0.2s ease-in-out;
          border: 1.5px solid transparent;
          box-sizing: border-box;
        }

        .input-field:focus-within {
          background-color: #ffffff;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .input-field i,
        .input-field .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
          margin-right: 0.75rem;
          font-size: 1.1rem;
          flex-shrink: 0;
          line-height: normal;
        }

        .input-field input {
          background: transparent !important;
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-appearance: none !important;
          line-height: normal;
          font-weight: 500;
          font-size: 0.95rem;
          color: #1e293b;
          width: 100%;
          flex: 1;
          min-width: 0;
          padding: 0;
          margin: 0;
        }

        .input-field input:focus,
        .input-field input:focus-visible {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-appearance: none !important;
        }

        .input-field input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .input-field .toggle-password-btn {
          background: transparent;
          border: none;
          outline: none;
          padding: 6px;
          margin-left: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 50%;
          transition: color 0.2s, background-color 0.2s;
          flex-shrink: 0;
        }

        .input-field .toggle-password-btn:hover {
          color: #475569;
          background-color: rgba(0, 0, 0, 0.06);
        }

        .input-field .toggle-password-btn:focus,
        .input-field .toggle-password-btn:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          color: #667eea;
        }

        .btn {
          width: 150px;
          background-color: #667eea;
          border: none;
          outline: none;
          height: 49px;
          border-radius: 49px;
          color: #fff;
          text-transform: uppercase;
          font-weight: 600;
          margin: 10px 0;
          cursor: pointer;
          transition: 0.5s;
          font-size: 0.9rem;
        }

        .btn:hover {
          background-color: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-around;
          text-align: center;
          z-index: 6;
        }

        .left-panel {
          pointer-events: all;
          padding: 3rem 17% 2rem 12%;
        }

        .right-panel {
          pointer-events: none;
          padding: 3rem 12% 2rem 17%;
        }

        .panel .content {
          color: #fff;
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
        }

        .panel h3 {
          font-weight: 600;
          line-height: 1;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        .panel p {
          font-size: 0.95rem;
          padding: 0.7rem 0;
        }

        .btn.transparent {
          margin: 0;
          background: none;
          border: 2px solid #fff;
          width: 130px;
          height: 41px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .btn.transparent:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .right-panel .content {
          transform: translateX(800px);
        }

        .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
        }

        .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
        }

        .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        .container:before {
          content: "";
          position: absolute;
          height: 2000px;
          width: 2000px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(-45deg, #667eea 0%, #764ba2 100%);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        .social-text {
          padding: 0.6rem 0 0.8rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #94a3b8;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 380px;
          gap: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .social-text::before,
        .social-text::after {
          content: "";
          flex: 1;
          height: 1px;
          background-color: #e2e8f0;
        }

        .social-media {
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 380px;
        }

        .google-btn {
          width: 100%;
          height: 48px;
          border-radius: 48px;
          border: 1.5px solid #e2e8f0;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .google-btn:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .google-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 870px) {
          .container {
            min-height: 800px;
            height: 100vh;
          }
          .signin-signup {
            width: 100%;
            top: 95%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }
          .signin-signup,
          .container.sign-up-mode .signin-signup {
            left: 50%;
          }
          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2.5rem 8%;
            grid-column: 1 / 2;
          }
          .right-panel {
            grid-row: 3 / 4;
          }
          .left-panel {
            grid-row: 1 / 2;
          }
          .panel .content {
            padding-right: 15%;
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }
          .panel h3 {
            font-size: 1.2rem;
          }
          .panel p {
            font-size: 0.7rem;
            padding: 0.5rem 0;
          }
          .btn.transparent {
            width: 110px;
            height: 35px;
            font-size: 0.7rem;
          }
          .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }
          .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .right-panel .content {
            transform: translateY(300px);
          }
          .container.sign-up-mode .signin-signup {
            top: 5%;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 570px) {
          form {
            padding: 0 1.5rem;
          }
          .panel .content {
            padding: 0.5rem 1rem;
          }
        }
      `}</style>

      <div className={isSignUp ? "container sign-up-mode" : "container"}>
        <div className="forms-container">
          <div className="signin-signup">
            <form className="sign-in-form" onSubmit={handleSignIn}>
              <h2 className="title">Sign in</h2>
              <div className="input-field">
                <i className="icon-wrapper">
                  <Mail size={18} />
                </i>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  defaultValue="recruiter@demo.interviewshield.dev"
                  required
                />
              </div>
              <div className="input-field">
                <i className="icon-wrapper">
                  <Lock size={18} />
                </i>
                <input
                  type={showSignInPassword ? "text" : "password"}
                  name="password"
                  data-password="true"
                  placeholder="Password"
                  defaultValue="demo123"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  aria-label={showSignInPassword ? "Hide password" : "Show password"}
                  title={showSignInPassword ? "Hide password" : "Show password"}
                >
                  {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input
                type="submit"
                value={isLoading ? "Processing..." : "Login"}
                className="btn solid"
                disabled={isLoading}
              />
              <p className="social-text">Or continue with</p>
              <div className="social-media">
                <GoogleAuthButton onGoogleClick={onGoogleSignIn} />
              </div>
            </form>

            <form className="sign-up-form" onSubmit={handleSignUp}>
              <h2 className="title">Sign up</h2>
              <div className="input-field">
                <i className="icon-wrapper">
                  <User size={18} />
                </i>
                <input type="text" name="username" placeholder="Username" required />
              </div>
              <div className="input-field">
                <i className="icon-wrapper">
                  <Mail size={18} />
                </i>
                <input type="email" name="signup-email" placeholder="Email" required />
              </div>
              <div className="input-field">
                <i className="icon-wrapper">
                  <Lock size={18} />
                </i>
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  name="signup-password"
                  data-password="true"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                  title={showSignUpPassword ? "Hide password" : "Show password"}
                >
                  {showSignUpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input
                type="submit"
                value={isLoading ? "Processing..." : "Sign up"}
                className="btn"
                disabled={isLoading}
              />
              <p className="social-text">Or continue with</p>
              <div className="social-media">
                <GoogleAuthButton onGoogleClick={onGoogleSignIn} isSignUp={true} />
              </div>
            </form>
          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>New here?</h3>
              <p>
                Join us today and discover a world of possibilities. Create your
                account in seconds!
              </p>
              <button
                type="button"
                className="btn transparent"
                onClick={() => setIsSignUp(true)}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>One of us?</h3>
              <p>Welcome back! Sign in to continue your journey with us.</p>
              <button
                type="button"
                className="btn transparent"
                onClick={() => setIsSignUp(false)}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleAuthButton({ onGoogleClick, isSignUp = false }: { onGoogleClick?: () => void; isSignUp?: boolean }) {
  return (
    <button
      type="button"
      onClick={onGoogleClick}
      className="google-btn"
      aria-label={isSignUp ? "Sign up with Google" : "Sign in with Google"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span>{isSignUp ? "Sign up with Google" : "Sign in with Google"}</span>
    </button>
  );
}
