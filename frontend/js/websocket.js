let ws = null;

window.connectWS = (role) => {
    const WS_URL = 'ws://localhost:8080';
    ws = new WebSocket(`${WS_URL}/ws?role=${role}`);

    ws.onmessage = (e) => {
        const { event, data } = JSON.parse(e.data);

        // function call
        if (event === 'new_order')      window.onNewOrder?.(data);
        if (event === 'order_updated')  window.onOrderUpdated?.(data);
        if (event === 'menu_updated')   window.onMenuUpdated?.(data);
        if (event === 'order_paid')     window.onOrderPaid?.(data);
        if (event === 'attend_updated') window.onAttendUpdated?.(data);
    };

    //reconnect after 3s if connection lost
    ws.onclose = () => {
        setTimeout(() => connectWS(role), 3000);
    };
};
