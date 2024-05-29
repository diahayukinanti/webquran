const BASE_URL = "https://equran.id/api/v2";
let selectedAudio = "01";

const audioList = {
    "01": "Abdullah-Al-Juhany",
    "02": "Abdul-Muhsin-Al-Qasim",
    "03": "Abdurrahman-as-Sudais",
    "04": "Ibrahim-Al-Dossari",
    "05": "Misyari-Rasyid-Al-Afasi"
};

const quranSurah = async () => {
    const endpoint = `${BASE_URL}/surat`;
    const response = await fetch(endpoint);
    const data = await response.json();
    return data.data;
};

const quranDetail = async (nomor) => {
    const endpoint = `${BASE_URL}/surat/${nomor}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    console.log(data.data);
    return data.data;
};

const toArabicNumber = (number) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return number.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('');
};

quranSurah().then((surat) => {
    surat.forEach((surah) => {
        const arabicNumber = toArabicNumber(surah.nomor);
        const list = `<a href="#" class="color-edit list-group-item list-group-item-action" id="surah-${surah.nomor}">
                        ${arabicNumber} - ${surah.namaLatin} (${surah.nama})
                      </a>`;
        document.querySelector("#daftar-surah").insertAdjacentHTML("beforeend", list);

        document.querySelector(`#surah-${surah.nomor}`).addEventListener("click", function (event) {
            event.preventDefault();
            document.querySelector(`#text-arabic`).innerHTML = "";

            quranDetail(surah.nomor).then((detail) => {
                let detailSurah = `
                    <h2 class="text-center">${detail.namaLatin} (${detail.nama})</h2>
                    <p><strong>Arti:</strong> ${detail.arti}</p>
                    <p><strong>Jumlah Ayat:</strong> ${detail.jumlahAyat}</p>
                    <p><strong>Tempat Turun:</strong> ${detail.tempatTurun}</p>
                    <p><strong>Qari:</strong></p>
                    <select id="audio-selector">
                        ${Object.keys(detail.audioFull).map(key => `<option value="${key}">${audioList[key]}</option>`).join('')}
                    </select>
                    <hr style="border: 2px solid #6F4E37;">
                    <h3>Ayat:</h3>`;

                detail.ayat.forEach((ayah, index) => {
                    detailSurah += `<div class="row mt-4" id="ayah-${index}">
                        <div class="col-11">
                            <button style="color: #74512D; text-decoration: none;" class="btn btn-link play-audio" data-audio="${ayah.audio[selectedAudio]}" data-index="${index}">
                                <i class="fa fa-play"></i> play
                            </button>
                            <button style="color: #74512D; text-decoration: none;" class="btn btn-link stop-audio" data-index="${index}">
                                <i class="fa fa-stop"></i> Stop
                            </button>
                        </div>
                        <div class="col-15 card-view" id="card-view-${index}">
                            <div style="font-size: small;" class="list-group shadow-sm text-end amiri" title="${ayah.teksIndonesia}">
                                <p class="fs-5 p-3">${ayah.teksArab}</p>
                                <div class="list-group shadow-sm fs-5 text-end amiri">
                                    <p class="fs-6 pt-2 pe-3">${ayah.teksIndonesia}</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                });

                if (detail.suratSebelumnya) {
                    detailSurah += `<p><strong>Surat Sebelumnya:</strong> <a href="#" id="previous-surah">${detail.suratSebelumnya.namaLatin}</a></p>`;
                }

                if (detail.suratSelanjutnya) {
                    detailSurah += `<p><strong>Surat Selanjutnya:</strong> <a href="#" id="next-surah">${detail.suratSelanjutnya.namaLatin}</a></p>`;
                }

                document.querySelector(`#text-arabic`).innerHTML = detailSurah;

                document.querySelector("#audio-selector").addEventListener("change", function () {
                    selectedAudio = this.value;
                    document.querySelectorAll(".play-audio").forEach((button) => {
                        const ayatIndex = button.getAttribute('data-index');
                        const ayat = detail.ayat[ayatIndex];
                        button.setAttribute('data-audio', ayat.audio[selectedAudio]);
                    });
                });

                const scrollToElement = (element) => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                };

                const playNextAyah = (currentIndex) => {
                    const nextIndex = parseInt(currentIndex) + 1;
                    const nextAyahButton = document.querySelector(`.play-audio[data-index="${nextIndex}"]`);
                    if (nextAyahButton) {
                        scrollToElement(nextAyahButton);
                        nextAyahButton.click();
                    }
                };

                document.querySelectorAll('.play-audio').forEach(button => {
                    button.addEventListener('click', function () {
                        const audioSrc = this.getAttribute('data-audio');
                        let audioPlayer = document.querySelector('#audio-player');
                        const ayahIndex = this.getAttribute('data-index');
                        const ayahElement = document.querySelector(`#ayah-${ayahIndex}`);
                        const cardViewElement = document.querySelector(`#card-view-${ayahIndex}`);

                        scrollToElement(ayahElement);

                        document.querySelectorAll('.play-audio').forEach(btn => btn.classList.remove('active'));
                        document.querySelectorAll('.card-view').forEach(card => card.classList.remove('highlight'));
                        this.classList.add('active');
                        cardViewElement.classList.add('highlight');

                        if (!audioPlayer) {
                            audioPlayer = document.createElement('audio');
                            audioPlayer.id = 'audio-player';
                            audioPlayer.controls = false;
                            audioPlayer.src = audioSrc;
                            document.body.appendChild(audioPlayer);

                            audioPlayer.addEventListener('ended', function () {
                                const currentAyatButton = document.querySelector('.play-audio.active');
                                if (currentAyatButton) {
                                    const currentIndex = currentAyatButton.getAttribute('data-index');
                                    playNextAyah(currentIndex);
                                }
                            });

                            audioPlayer.play();
                        } else {
                            audioPlayer.src = audioSrc;
                            audioPlayer.play();
                        }
                    });
                });

                if (detail.suratSebelumnya) {
                    document.querySelector('#previous-surah').addEventListener('click', function (event) {
                        event.preventDefault();
                        document.querySelector(`#surah-${detail.suratSebelumnya.nomor}`).click();
                    });
                }

                if (detail.suratSelanjutnya) {
                    document.querySelector('#next-surah').addEventListener('click', function (event) {
                        event.preventDefault();
                        document.querySelector(`#surah-${detail.suratSelanjutnya.nomor}`).click();
                    });
                }

                document.querySelectorAll('.stop-audio').forEach(button => {
                    button.addEventListener('click', function () {
                        const audioPlayer = document.querySelector('#audio-player');
                        if (audioPlayer) {
                            audioPlayer.pause();
                            document.querySelectorAll('.card-view').forEach(card => card.classList.remove('highlight'));
                        }
                    });
                });
            });
        });
    });
});

