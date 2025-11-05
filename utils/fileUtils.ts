
import { ProjectFile } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove data:mime/type;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export const createProjectFile = async (file: File): Promise<ProjectFile> => {
    const content = await fileToBase64(file);
    return {
        name: file.name,
        type: file.type,
        content: content
    };
};
