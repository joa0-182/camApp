import { Injectable } from '@angular/core';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Foto } from '../Interfaces/Foto.interface';

@Injectable({
  providedIn: 'root'
})
export class FotoService {
//cria a lista de fotos que vão estar armazanadas no dispositivo
  fotos: Foto[] = []

  //cria a variavel que armazena o local fisico (pasta) de armazenamento de fotos
  private FOTO_ARMAZENAMENTO: string = 'fotos';

  constructor() { }
  //Função para tirar / buscar novas fotos
  async tirarFoto(){
    // chama a função de camera e armazena o arquivo na constante
    const fotoCapturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // Dados baseados em arquivos | oferece melhor desempenho
      source: CameraSource.Camera, //tira uma nova foto com a camera
      quality: 100 // qualidade da imagem tirada, vai de 0 a 100
    })
  }
}
