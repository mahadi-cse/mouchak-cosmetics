import { v4 as uuidv4 } from 'uuid';

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const generateUniqueSlug = (text: string): string => {
  const baseSlug = generateSlug(text);
  const suffix = uuidv4().split('-')[0];
  return `${baseSlug}-${suffix}`;
};

export default generateSlug;
