import { useEffect, useState } from 'react';
import type { TAdminRole } from '@/services/type';
import type { INewRoleFormState } from './type';

const INITIAL: INewRoleFormState = {
  persona: 'admin',
  suffix: '',
  name: '',
};

const CODE_SUFFIX_REGEX = /^[a-z][a-z0-9_]*$/;

export const useNewRoleForm = (open: boolean) => {
  const [form, setForm] = useState<INewRoleFormState>(INITIAL);

  useEffect(() => {
    if (open) setForm(INITIAL);
  }, [open]);

  const setPersona = (persona: TAdminRole): void =>
    setForm((prev) => ({ ...prev, persona }));
  const setSuffix = (suffix: string): void =>
    setForm((prev) => ({ ...prev, suffix: suffix.trim().toLowerCase() }));
  const setName = (name: string): void =>
    setForm((prev) => ({ ...prev, name }));

  const fullCode = form.suffix ? `${form.persona}.${form.suffix}` : '';
  const suffixValid =
    form.suffix.length > 0 && CODE_SUFFIX_REGEX.test(form.suffix);
  const nameValid = form.name.trim().length > 0;
  const canSubmit = suffixValid && nameValid;

  return {
    form,
    fullCode,
    suffixValid,
    nameValid,
    canSubmit,
    setPersona,
    setSuffix,
    setName,
  };
};
