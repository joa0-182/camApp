import { Injectable } from '@angular/core';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { actionSheetController } from '@ionic/core';
import { Foto } from '../Interfaces/Foto.interface';

@Injectable({
  providedIn: 'root'
})
export class FotoService {
  //cria a lista de fotos que vão estar armazanadas no dispositivo
  fotos: Foto[] = []

  //cria a variavel que armazena o local fisico (pasta) de armazenamento de fotos
  private FOTO_ARMAZENAMENTO: string = 'fotos';
  actionSheetController: any;

  constructor(private platform: Platform) { }

  public async carregarFotosSalvas() {
    // recuperar as fotos em cache
    const listaFotos = await Preferences.get({ key: this.FOTO_ARMAZENAMENTO });
    this.fotos = JSON.parse(listaFotos.value as string) || [];

    // se não estiver rodando no navegador...
    if (!this.platform.is('hybrid')) {
      // exibir a foto lendo-a no formato base64
      for (let foto of this.fotos) {
        // ler os dados de cada foto salva no sistema de arquivos
        const readFile = await Filesystem.readFile({
          path: foto.filepath,
          directory: Directory.Data,
        });

        // Somente na plataforma da web: Carregar a foto como dados base64
        foto.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }
  //Função para tirar / buscar novas fotos
  public async tirarFoto() {
    // chama a função de camera e armazena o arquivo na constante
    const fotoCapturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // Dados baseados em arquivos | oferece melhor desempenho
      source: CameraSource.Camera, //tira uma nova foto com a camera
      quality: 50, // qualidade da imagem tirada, vai de 0 a 100 ///// Trocar para 50 para não precisar fazer compactação de imagem
    });

    const salvarArquivoFoto = await this.salvarFoto(fotoCapturada);

    // adicionar nova foto à matriz fotos
    this.fotos.unshift(salvarArquivoFoto);

    //Armazena em cache todos os dados da foto para recuperação futura
    Preferences.set({
      key: this.FOTO_ARMAZENAMENTO,
      value: JSON.stringify(this),
    });
  }

  // salvar imagem em um arquivo no dispositivo
  private async salvarFoto(foto: Photo) {
    // converta a foto para o formato base64, exigido pela API do sistema de arquivos para salvar
    const base64Data = await this.readAsBase64(foto);

    // gravar o arquivo no diretório de dados
    const nomeArquivo = new Date().getTime() + '.jpeg';
    const arquivoSalvo = await Filesystem.writeFile({
      path: nomeArquivo,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      // exiba a nova imagem reescrevendo o caminho 'file://' para HTTP
      // detalhes: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: arquivoSalvo.uri,
           webviewPath: Capacitor.convertFileSrc(arquivoSalvo.uri),
      };
    } else {
      // use o webPath para exibir a nova imagem em vez da base64, pois ela já está carregada na memória
      return {
        filepath: nomeArquivo,
        webviewPath: foto.webPath,
      };
    }
  }

  // Leia a foto da camera no formato base64 com base na plataforma em que o aplicativo está sendo executado
  private async readAsBase64(foto: Photo) {
    // "híbrido" detectará Cordova ou Capacitor

    if (this.platform.is('hybrid')) {
      // ler o arquivo no formato base64
      const arquivo = await Filesystem.readFile({
        path: foto.path as string,
      });

      return arquivo.data;
    } else {
      // obtenha a foto, leia-a como um blob e, em seguida, converta-a para o formato base64
      const resposta = await fetch(foto.webPath!);
      const blob = await resposta.blob();

      return (await this.convertBlobToBase64(blob)) as string;
    }
  }

  // excluir a imagem, removendo-a dos dados de referencia e do sistema de arquivos

  public async deletePicture(foto: Foto, posicao: number) {
    // remover essa foto da matriz  de dados de referencia Fotos
    this.fotos.splice(posicao, 1);

    // atulizar o cache da matriz de fotos sobrescevendo a matriz de fotos existente
    Preferences.set({
      key: this.FOTO_ARMAZENAMENTO,
      value: JSON.stringify(this.fotos),
    });

    const nomeArquivo = foto.filepath.substr(foto.filepath.lastIndexOf('/') + 1);
    await Filesystem.deleteFile ({
      path: nomeArquivo,
      directory: Directory.Data,
    });
  }

  convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

}
