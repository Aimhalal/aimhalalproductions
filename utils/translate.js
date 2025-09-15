import language from '../models/language.js';
import fetch from 'node-fetch';
import axios from 'axios';
import items from '../models/items.js';
import stores from '../models/stores.js';
import category from '../models/category.js';
import users from '../models/users.js';

const apiKey = 'AIzaSyC8brm2nGwlgV58y-IXEtgLxhkXyxBYOYk';

const supportedLanguages = async() =>{
    try
    {
        let languages = await language.find({})
        return languages
    }
    catch(error)
    {
        return []

    }
}

const translateText  = async(product,model = 'product') =>{
    try
    {
        let languages  = await supportedLanguages();
        let lan = [];
        let desLan = []

        // stores

        let store_lang = []
        let aboutus_lang = []
        let zone_lang = []
        let area_lang = []


        //  category


        //  user

        let name_lang = [];
        let address_lang = []
        let city_lang = []

        // end user


        let categories = []

        if(model == 'product')
        {   

            product.item_lang = await Promise.all(languages.map(async lang => {
                const translatedItem = await googleTranslate(product.item, lang.code);
                lan.push({
                    lang: lang._id,
                    value: translatedItem
                })
                return {
                    lang: lang._id,
                    value: translatedItem
                };
            }));
    
            // Translate and update 'description_lang'
            product.description_lang = await Promise.all(languages.map(async lang => {
                const translatedDescription = await googleTranslate(product.description, lang.code);
                desLan.push({
                    lang: lang._id,
                    value: translatedDescription
                })
                return {
                    lang: lang._id,
                    value: translatedDescription
                };
            }));

            await items.findByIdAndUpdate({
                _id : product._id
            },{
                $set : {
                    item_lang : lan,
                    description_lan : desLan
                }
            },{
                new : true
            })
        }
        else if(model == 'store')
        {
            product.store_lang = await Promise.all(languages.map(async lang => {
                const translatedItem = await googleTranslate(product.store_name, lang.code);
                store_lang.push({
                    lang: lang._id,
                    value: translatedItem
                })
                return {
                    lang: lang._id,
                    value: translatedItem
                };
            }));
    
            // Translate and update 'description_lang'
            product.aboutus_lang = await Promise.all(languages.map(async lang => {
                const translatedDescription = await googleTranslate(product.aboutus, lang.code);
                aboutus_lang.push({
                    lang: lang._id,
                    value: translatedDescription
                })
                return {
                    lang: lang._id,
                    value: translatedDescription
                };
            }));


            // Translate and update 'description_lang'
            product.zone_lang = await Promise.all(languages.map(async lang => {
                const translatedDescription = await googleTranslate(product.zone, lang.code);
                zone_lang.push({
                    lang: lang._id,
                    value: translatedDescription
                })
                return {
                    lang: lang._id,
                    value: translatedDescription
                };
            }));

            product.area_lang = await Promise.all(languages.map(async lang => {
                const translatedDescription = await googleTranslate(product.area, lang.code);
                area_lang.push({
                    lang: lang._id,
                    value: translatedDescription
                })
                return {
                    lang: lang._id,
                    value: translatedDescription
                };
            }));

            await stores.findByIdAndUpdate({
                _id : product._id
            },{
                $set : {
                    store_lang : aboutus_lang,
                    aboutus_lang : aboutus_lang,
                    zone_lang : zone_lang,
                    area_lang : area_lang
                }
            },{
                new : true
            })
        }
        else if(model == 'user')
        {
            product.username = await Promise.all(languages.map(async lang => {
                const translatedDescription = await googleTranslate(product.username, lang.code);
                name_lang.push({
                    lang: lang._id,
                    value: translatedDescription
                })
                return {
                    lang: lang._id,
                    value: translatedDescription
                };
            }));


            product.address = await Promise.all(languages.map(async lang => {
                const translatedDescription = await googleTranslate(product.address, lang.code);
                address_lang.push({
                    lang: lang._id,
                    value: translatedDescription
                })
                return {
                    lang: lang._id,
                    value: translatedDescription
                };
            }));


            product.city = await Promise.all(languages.map(async lang => {
                const translatedDescription = await googleTranslate(product.address, lang.code);
                city_lang.push({
                    lang: lang._id,
                    value: translatedDescription
                })
                return {
                    lang: lang._id,
                    value: translatedDescription
                };
            }));

            console.log(product)
            await users.findByIdAndUpdate({
                _id : product._id
            },{
                $set : {
                    username_lang : name_lang,
                    address_lang : address_lang,
                    city_lang : city_lang
                }
            },{
                new : true
            })



        }
        else if ( model == 'category' )
        {
            product.name_lang = await Promise.all(languages.map(async lang => {
                const translatedDescription = await googleTranslate(product.name, lang.code);
                categories.push({
                    lang: lang._id,
                    value: translatedDescription
                })
                return {
                    lang: lang._id,
                    value: translatedDescription
                };
            }));


            await category.findByIdAndUpdate({
                _id : product._id
            },{
                $set : {
                    name_lang : categories
                }
            },{
                new : true
            })
        }
        
    }
    catch(error)
    {
        console.log(error);
        return error.message
    }
}


// const googleTranslate = async(text, targetLanguage) =>
// {
//     try {
//         const [translation] = await translateClient.translate(text, targetLanguage);
//         return translation;
//     } catch (error) {
//         console.error(error);
//         throw new Error('Translation failed');
//     }
// }


// async function translateText(apiKey, text, targetLanguage = 'ar') {
//     const baseUrl = 'https://translation.googleapis.com/language/translate/v2';

//     const params = new URLSearchParams({
//         key: apiKey,
//         q: text,
//         target: targetLanguage,
//     });

//     const url = `${baseUrl}?${params.toString()}`;

//     try {
//         const response = await fetch(url);
//         const data = await response.json();

//         if (data.data && data.data.translations && data.data.translations[0].translatedText) {
//             return data.data.translations[0].translatedText;
//         } else {
//             throw new Error('Translation not available.');
//         }
//     } catch (error) {
//         console.error('Failed to fetch translation.', error.message);
//         throw new Error('Failed to fetch translation.');
//     }
// }


const googleTranslate = async (text, targetLanguage) => {
    const baseUrl = 'https://translation.googleapis.com/language/translate/v2';

        const params = {
            key: apiKey,
            q: text,
            target: targetLanguage,
        };

    
    try {
        
        const response = await axios.get(baseUrl, { params });
        if (!response.data || !response.data.data || !response.data.data.translations || !response.data.data.translations[0].translatedText) {
            throw new Error('Translation not available.');
        }
        return response.data.data.translations[0].translatedText
    } catch (error) {
        console.error('Failed to fetch translation.', error.message);
        // throw new Error('Failed to fetch translation.');
    }
};


export default {
    translateText,
    googleTranslate
}