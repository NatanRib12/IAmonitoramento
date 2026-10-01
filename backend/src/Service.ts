import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function processarVideoIA(videoPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), '../motorIA/videoprocess.py');
    const caminhoVideoAbsoluto = path.resolve(videoPath);

    const venvPythonWindows = path.resolve(process.cwd(), '../.venv/Scripts/python.exe');
    
    const pythonExecutable = fs.existsSync(venvPythonWindows) 
      ? `"${venvPythonWindows}"` 
      : 'python';

    exec(
      `${pythonExecutable} "${scriptPath}" "${caminhoVideoAbsoluto}"`, 
      { maxBuffer: 1024 * 1024 * 50 },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Erro ao executar Python: ${error.message}`);
          return reject(error);
        }
        
        try {
          // Isola e extrai apenas a linha que contém a estrutura do JSON
          const linhas = stdout.split(/\r?\n/);
          const linhaJson = linhas.reverse().find(linha => linha.trim().startsWith('{'));

          if (!linhaJson) {
            throw new Error('Nenhum JSON válido foi encontrado na saída do Python.');
          }

          const resultado = JSON.parse(linhaJson.trim());
          resolve(resultado);
        } catch (parseError) {
          console.error('Saída bruta do Python:', stdout);
          reject(new Error('Resposta inválida do motor de IA'));
        }
      }
    );
  });
}