"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export function StaffConfirmationModalTile({ isOpen, onClose, onConfirm, message }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-90 flex justify-center items-center">
            <div className="bg-white p-4 rounded w-full my-8 lg:w-1/2">
                <p>{message}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 border rounded text-black">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 border rounded bg-blue-500 text-white">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
