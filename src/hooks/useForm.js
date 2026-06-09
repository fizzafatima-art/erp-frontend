import { useState } from 'react';

const useForm = (initialValues, callback) => {
  const [values, setValues] = useState(initialValues);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    callback();
  };

  const reset = () => setValues(initialValues);

  return { values, handleChange, handleSubmit, reset };
};

export default useForm;
