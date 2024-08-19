import { jsonrepair } from 'jsonrepair'

export async function generateDescriptiveJson() {
    const descriptors = [
        'concrete',
        'logical',
        'relevant',
        'meaningful',
        'poetic',
        'creative',
        'popularCulture',
        'traditional'
    ];

    const result = {};

    // Add individual descriptors
    descriptors.forEach((descriptor) => {
        let desc = descriptor.charAt(0).toUpperCase() + descriptor.slice(1);
        result[`most${desc}`] = {
            result: "string",
            explanation: "string"
        };
    });

    // Generate combinations
    for (let i = 0; i < descriptors.length; i++) {
        for (let j = i + 1; j < descriptors.length; j++) {
            let d1 = descriptors[i].charAt(0).toUpperCase() + descriptors[i].slice(1);
            let d2 = descriptors[j].charAt(0).toUpperCase() + descriptors[j].slice(1);
            const combination = `most${d1} + most${d2}`;
            result[combination] = {
                result: "string",
                explanation: "string"
            };
        }
    }

    let resultJson = await jsonrepair(JSON.stringify(result));

    return resultJson;
}
