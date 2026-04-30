[OPEN] login-error-popup

## Problem
- Actual: login API returns `isSucc: false` with `err.message = "用户名或密码错误"` but the frontend shows no visible error.
- Expected: when login fails, the frontend should show a visible unified error popup/message with the backend message.

## Reproduction
1. Open the login page.
2. Enter an incorrect username or password.
3. Click `登录`.
4. Observe that the request returns a failure payload but no visible error appears.

## Hypotheses
- A: `LoginPage` does not reach the failure-handling path after the API call returns.
- B: `callApi` receives the failed TSRPC result but does not execute the unified error display branch.
- C: the unified error display branch runs, but DOM creation/mounting fails.
- D: a redirect or other runtime exception clears the UI immediately after the error is shown.

## Notes
- Session ID: `login-error-popup`
- Status: collecting runtime evidence
