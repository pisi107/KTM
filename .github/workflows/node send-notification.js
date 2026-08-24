- name: Check new orders
  env:
    FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
  run:
    node send-notification.js
