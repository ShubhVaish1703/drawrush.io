"use client";
import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
                duration: 3000,
                style: {
                    background: "#1e293b",
                    color: "#fff",
                },
            }}
        />
    );
}
