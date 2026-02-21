interface InputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  icon,
}: InputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-800">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          className={`w-full px-4 py-3 ${icon ? "pl-10" : "pl-4"} pr-4 border-2 border-gray-300 rounded-xl 
            focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 
            transition-all duration-200 bg-white text-gray-900 placeholder-gray-400`}
        />
      </div>
    </div>
  );
}
