import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function processarVideoIA(input: Buffer | string): Promise<any> {
  let tempFilePath: string | null = null;

  try {
    let caminhoVideoAbsoluto: string;

    if (typeof input === 'string') {
      caminhoVideoAbsoluto = path.resolve(input);
    } else {
      tempFilePath = path.join(os.tmpdir(), `temp-video-${Date.now()}.mp4`);
      fs.writeFileSync(tempFilePath, input);
      caminhoVideoAbsoluto = tempFilePath;
    }

    const scriptPath = path.resolve(process.cwd(), '../motorIA/videoprocess.py');
    const venvPythonWindows = path.resolve(process.cwd(), '../.venv/Scripts/python.exe');

    const pythonExecutable = fs.existsSync(venvPythonWindows) 
      ? `"${venvPythonWindows}"` 
      : 'python';

    const resultado = await new Promise<any>((resolve, reject) => {
      exec(
        `${pythonExecutable} "${scriptPath}" "${caminhoVideoAbsoluto}"`, 
        { maxBuffer: 1024 * 1024 * 50 },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Erro ao executar Python: ${error.message}`);
            return reject(error);
          }

          try {
            // Isola estritamente a linha do JSON completo que inicia com { e termina com }
            const linhas = stdout.split(/\r?\n/);
            const linhaJson = linhas
              .reverse()
              .find(linha => linha.trim().startsWith('{') && linha.trim().endsWith('}'));

            if (!linhaJson) {
              throw new Error('Nenhum JSON válido foi encontrado na saída do Python.');
            }

            const res = JSON.parse(linhaJson.trim());
            resolve(res);
          } catch (parseError) {
            console.error('Saída bruta do Python:', stdout);
            reject(new Error('Resposta inválida do motor de IA'));
          }
        }
      );
    });

    return resultado;

  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Erro ao deletar arquivo temporário:', e);
      }
    }
  }
}